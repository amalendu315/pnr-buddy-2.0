import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios, { AxiosResponse } from "axios";
import * as XLSX from "xlsx";
import moment from "moment-timezone";

// ADJUST IMPORT PATH: Ensure this points to your actual constants file
import {
  akasaPnrRetrieveUrl,
  akasaTokenUrl,
  spicejetPnrRetrieveUrl,
  spicejetTokenUrl,
} from "@/constants";

// ==========================================
// SHARED UTILITIES
// ==========================================

const checkTimeFormat = (text: string): string => {
  if (
    text.charAt(0) === "0" ||
    text.slice(0, 2) === "11" ||
    text.slice(0, 2) === "10"
  ) {
    return text.concat(" ", "AM");
  } else {
    return text.concat(" ", "PM");
  }
};

// ==========================================
// AKASA LOGIC
// ==========================================

const AkasaTokenConfig = {
  method: "post",
  url: akasaTokenUrl,
  headers: {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  data: JSON.stringify({ clientType: "WEB" }),
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
};

async function fetchAkasaToken(
  maxAttempts: number,
  currentAttempt = 1
): Promise<AxiosResponse> {
  return axios(AkasaTokenConfig)
    .then((response) => {
      if (response.data.data.token && response.data.data.token.length > 0) {
        return response.data;
      } else if (currentAttempt < maxAttempts) {
        return fetchAkasaToken(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached for Akasa Token");
      }
    })
    .catch((error) => {
      if (currentAttempt < maxAttempts) {
        return fetchAkasaToken(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached after error");
      }
    });
}

async function processAkasaFile(buffer: Buffer) {
  const data = await fetchAkasaToken(10);
  const myToken = data?.data?.token;
  const header = `Bearer ${myToken}`;

  // Read Excel from Buffer
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]]; // Default to first sheet
  // ws["!ref"] = "A1:K3000"; // Optional: Force range if needed
  const jsonSheet: any[] = XLSX.utils.sheet_to_json(ws);

  const chunkSize = 30;
  const allResults: any[] = [];

  for (let i = 0; i < jsonSheet.length; i += chunkSize) {
    const chunk = jsonSheet.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (record: any) => {
        const PNR = record?.PNR;
        if (!PNR) return null;

        const config = {
          method: "get",
          url: `${akasaPnrRetrieveUrl}?recordLocator=${PNR}&emailAddress=Airlines@Airiq.In`,
          headers: {
            Authorization: header,
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        };

        let response: AxiosResponse<any>;
        try {
          response = await axios(config);
        } catch (error: any) {
          return {
            pnr: PNR,
            error: `Error processing PNR ${PNR}: ${error?.message}`,
          };
        }

        try {
          if (!response || !response.data || !response.data.data) {
            throw new Error("Invalid API response");
          }

          const bookingData = response.data.data;
          const journeys = bookingData.journeys;

          if (journeys?.length > 0) {
            const PNR = bookingData?.recordLocator;
            const Destination = journeys[0].designator.destination;
            const Origin = journeys[0].designator.origin;
            const depDate = journeys[0].designator.departure.slice(0, 10);
            const arrTime = checkTimeFormat(
              journeys[0].designator.arrival.slice(11, 16)
            );
            const depTime = checkTimeFormat(
              journeys[0].designator.departure.slice(11, 16)
            );
            const PAX = Object.keys(bookingData.breakdown.passengers).length;
            const flightReference = journeys[0].segments[0].flightReference;
            const qpCodeRegex = /QP(\d+)/;
            const match = flightReference.match(qpCodeRegex);
            const flightNumber = match ? match[1] : null;

            // Comparison Logic
            const OldPur = JSON.stringify(record.Pur);

            // Time Logic (Timezone handling)
            const DepinputTime = record.Dep;
            const date = moment.utc(DepinputTime).tz("Asia/Kolkata");
            const minute = date.minutes();
            const lastDigit = minute % 10;
            const roundedMinutes =
              lastDigit === 0 || lastDigit === 5 ? minute : minute + 1;
            date.minutes(roundedMinutes);
            const OldDep = date.format("HH:mm A");

            const ArrinputTime = record.Arr;
            const dateb = moment.utc(ArrinputTime).tz("Asia/Kolkata");
            const minuteb = dateb.minutes();
            const lastDigitb = minuteb % 10;
            const roundedMinutesb =
              lastDigitb === 0 || lastDigitb === 5 ? minuteb : minuteb + 1;
            dateb.minutes(roundedMinutesb);
            const OldArr = dateb.format("HH:mm A");

            const OldDate = moment(record.TravelDate).format("YYYY-MM-DD");

            const CheckStatus = () => {
              if (
                record.Flight != flightNumber ||
                OldPur != JSON.stringify(PAX) ||
                OldDate != depDate ||
                OldDep != depTime ||
                OldArr != arrTime
              ) {
                return "BAD";
              } else {
                return "GOOD";
              }
            };

            const MyRemarks = CheckStatus();
            const resultString = `${PNR}|${Origin}|${Destination}|${record.Flight}|${flightNumber}|${OldPur}|${PAX}|${OldDate}|${depDate}|${OldDep}|${depTime}|${OldArr}|${arrTime}|${MyRemarks}`;

            return {
              pnr: PNR,
              data: resultString,
            };
          } else {
            return {
              pnr: bookingData.recordLocator,
              data: `${bookingData.recordLocator} is Cancelled`,
            };
          }
        } catch (error: any) {
          if (error?.response?.status === 404) {
            return { pnr: PNR, error: `PNR NOT FOUND ${PNR}` };
          }
          return {
            pnr: PNR,
            error: `Processing Error ${PNR}: ${error.message}`,
          };
        }
      })
    );
    allResults.push(...chunkResults);
  }
  return allResults;
}

// ==========================================
// SPICEJET LOGIC
// ==========================================

const SpiceJetTokenConfig = {
  method: "post",
  url: spicejetTokenUrl,
  headers: { "Content-Type": "application/json" },
};

async function fetchSpiceJetToken(
  maxAttempts: number,
  currentAttempt = 1
): Promise<AxiosResponse<any>> {
  return axios(SpiceJetTokenConfig)
    .then((response) => {
      // Handle varied token structure if necessary
      const token =
        response.data?.data?.token || response.data?.data?.data?.token;
      if (token && token.length > 0) {
        return response;
      } else if (currentAttempt < maxAttempts) {
        return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached for SpiceJet");
      }
    })
    .catch((error) => {
      if (currentAttempt < maxAttempts) {
        return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached");
      }
    });
}

async function processSpiceJetFile(buffer: Buffer) {
  const data = await fetchSpiceJetToken(10);
  const myToken = data?.data?.data?.token || data?.data?.token;

  // Read Excel
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const jsonSheet: any[] = XLSX.utils.sheet_to_json(ws);

  const emailAddresses = [
    "airlines@airiq.in",
    "info.airiq@gmail.com",
    "accounts@airiq.in",
  ];

  const results = await Promise.all(
    jsonSheet.map(async (record: any) => {
      const PNR = record?.PNR;
      if (!PNR) return null;

      let bookingData: any = null;

      // Try multiple emails
      for (const email of emailAddresses) {
        try {
          const config = {
            method: "post",
            url: `${spicejetPnrRetrieveUrl}?recordLocator=${PNR}&emailAddress=${email}`,
            headers: {
              Authorization: myToken,
              "Content-Type": "application/json",
            },
          };
          const response = await axios(config);
          bookingData = response.data.data || response.data.bookingData;

          if (bookingData?.journeys || bookingData?.recordLocator) {
            break; // Found data
          }
        } catch (error: any) {
          if (error.response?.status === 404) continue;
          // Don't throw immediately, try next email
        }
      }

      if (!bookingData) {
        return { pnr: PNR, error: `All attempts failed for ${PNR}` };
      }

      try {
        const journeys = bookingData.journeys;

        if (journeys?.length > 0) {
          const designator = journeys[0].designator;
          const flightNumber = journeys[0].segments[0].identifier.identifier;
          const depSector = designator.origin;
          const arrSector = designator.destination;

          const depDetails = designator.departure.split("T");
          const depDate = depDetails[0];
          const depTime = checkTimeFormat(depDetails[1].substring(0, 5));

          const arrDetails = designator.arrival.split("T");
          const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));

          const PAX = Object.keys(bookingData.passengers).length;
          const OldPur = JSON.stringify(record.Pur);

          // Time Comparison Logic
          const DepinputTime = record.Dep;
          const depMoment = moment.utc(DepinputTime).tz("Asia/Kolkata");
          const depMin = depMoment.minutes();
          const depRoundedMin =
            depMin % 10 === 0 || depMin % 10 === 5 ? depMin : depMin + 1; // Logic derived from your code (though +1 logic usually for rounding, kept as is)
          // Actually, your logic says: if last digit is 0 or 5, keep it. Else minute + 1.
          // Careful: minute+1 on 59 becomes 60 which moment handles.

          // Re-implementing exact logic from snippet:
          let finalDepMin = depMin;
          if (depMin % 10 !== 0 && depMin % 10 !== 5) finalDepMin = depMin + 1;
          depMoment.minutes(finalDepMin);
          const OldDep = depMoment.format("HH:mm A");

          const ArrinputTime = record.Arr;
          const arrMoment = moment.utc(ArrinputTime).tz("Asia/Kolkata");
          const arrMin = arrMoment.minutes();
          let finalArrMin = arrMin;
          if (arrMin % 10 !== 0 && arrMin % 10 !== 5) finalArrMin = arrMin + 1;
          arrMoment.minutes(finalArrMin);
          const OldArr = arrMoment.format("HH:mm A");

          const OldDate = moment(record.TravelDate).format("YYYY-MM-DD");

          const CheckStatus = () => {
            if (
              record.Flight != flightNumber ||
              OldPur != JSON.stringify(PAX) ||
              OldDate != depDate ||
              OldDep != depTime ||
              OldArr != arrTime
            ) {
              return "BAD";
            } else {
              return "GOOD";
            }
          };

          const MyRemarks = CheckStatus();
          const resultString = `${PNR}|${depSector} ${arrSector}|${record.Flight}|${flightNumber}|${OldPur}|${PAX}|${OldDate}|${depDate}|${OldDep}|${depTime}|${OldArr}|${arrTime}|${MyRemarks}`;

          return { pnr: PNR, data: resultString };
        } else {
          return { pnr: PNR, data: `${PNR} is Cancelled` };
        }
      } catch (e: any) {
        return { pnr: PNR, error: `Processing Error ${e.message}` };
      }
    })
  );

  return results;
}

// ==========================================
// MAIN ROUTE HANDLER
// ==========================================

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const airline = formData.get("airline") as string; // Expect 'akasa' or 'spicejet'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawResults: any[] = [];

    // Select Airline Logic
    const airlineKey = airline ? airline.toLowerCase().trim() : "";

    if (airlineKey.includes("akasa") || airlineKey === "qp") {
      rawResults = await processAkasaFile(buffer);
    } else if (airlineKey.includes("spice") || airlineKey === "sg") {
      rawResults = await processSpiceJetFile(buffer);
    } else {
      return NextResponse.json(
        { error: "Unknown airline. Please specify 'akasa' or 'spicejet'." },
        { status: 400 }
      );
    }

    // Format results for response
    const formatted = rawResults.reduce(
      (acc, item) => {
        if (!item) return acc;
        if (item.error) {
          acc.errors.push(item.error);
        } else if (item.data) {
          acc.results.push(item.data);
        }
        return acc;
      },
      { results: [] as string[], errors: [] as string[] }
    );

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("Flight Ops API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
