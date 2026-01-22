import { NextRequest, NextResponse } from "next/server";
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
  if (!text) return "";

  // Split time into hours and minutes
  const parts = text.split(":");
  let hour = parseInt(parts[0]);
  const minute = parts[1];

  // Determine AM or PM
  const suffix = hour >= 12 ? "PM" : "AM";

  // Convert 24h to 12h
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'

  // Pad with leading zero if needed (e.g., 2 -> 02)
  const paddedHour = hour < 10 ? "0" + hour : hour;

  return `${paddedHour}:${minute} ${suffix}`;
};

// HELPER: Format Time from Excel Input (The key fix)
const formatExcelTime = (inputTime: any) => {
  const date = moment(inputTime);

  // Rounding Logic
  const minute = date.minutes();
  const lastDigit = minute % 10;
  const roundedMinutes =
    lastDigit === 0 || lastDigit === 5 ? minute : minute + 1;
  date.minutes(roundedMinutes);

  // FIX: Change 'HH' to 'hh' for 12-hour format
  return date.format("hh:mm A");
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
  // Remove httpsAgent for Vercel/Next.js (Edge/Serverless doesn't support it well)
  // If you are on Node, you can keep it, but axios default usually works.
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

  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
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

            // --- COMPARISON LOGIC (RESTORED) ---
            const OldPur = JSON.stringify(record.Pur); // e.g. "1" or "2"

            // Apply the rounding/timezone logic to Excel Inputs
            const OldDep = formatExcelTime(record.Dep);
            const OldArr = formatExcelTime(record.Arr);
            const OldDate = moment(record.TravelDate).format("YYYY-MM-DD");

            const CheckStatus = () => {
              if (
                record.Flight != flightNumber ||
                OldPur != JSON.stringify(PAX) ||
                OldDate != depDate ||
                OldDep != depTime || // Comparing formatted times
                OldArr != arrTime
              ) {
                return "BAD";
              } else {
                return "GOOD";
              }
            };

            const MyRemarks = CheckStatus();
            // result format: PNR|Origin|Dest|InputFlight|ApiFlight|InputPax|ApiPax|InputDate|ApiDate|InputDep|ApiDep|InputArr|ApiArr|Status
            const resultString = `${PNR}|${Origin}|${Destination}|${record.Flight}|${flightNumber}|${OldPur}|${PAX}|${OldDate}|${depDate}|${OldDep}|${depTime}|${OldArr}|${arrTime}|${MyRemarks}`;

            return { pnr: PNR, data: resultString };
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
      const token =
        response.data?.data?.token || response.data?.data?.data?.token;
      if (token && token.length > 0) return response;
      if (currentAttempt < maxAttempts)
        return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
      throw new Error("Maximum number of attempts reached for SpiceJet");
    })
    .catch((error) => {
      if (currentAttempt < maxAttempts)
        return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
      throw new Error("Maximum number of attempts reached");
    });
}

async function processSpiceJetFile(buffer: Buffer) {
  const data = await fetchSpiceJetToken(10);
  const myToken = data?.data?.data?.token || data?.data?.token;

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
          if (bookingData?.journeys || bookingData?.recordLocator) break;
        } catch (error: any) {
          if (error.response?.status === 404) continue;
        }
      }

      if (!bookingData)
        return { pnr: PNR, error: `All attempts failed for ${PNR}` };

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

          // --- COMPARISON LOGIC (RESTORED) ---
          const OldPur = JSON.stringify(record.Pur);

          // Apply same helper to SpiceJet excel inputs
          const OldDep = formatExcelTime(record.Dep);
          const OldArr = formatExcelTime(record.Arr);
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
    const airline = formData.get("airline") as string;

    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawResults: any[] = [];
    const airlineKey = airline ? airline.toLowerCase().trim() : "";

    if (airlineKey.includes("akasa") || airlineKey === "qp") {
      rawResults = await processAkasaFile(buffer);
    } else if (airlineKey.includes("spice") || airlineKey === "sg") {
      rawResults = await processSpiceJetFile(buffer);
    } else {
      return NextResponse.json({ error: "Unknown airline." }, { status: 400 });
    }

    const formatted = rawResults.reduce(
      (acc, item) => {
        if (!item) return acc;
        if (item.error) acc.errors.push(item.error);
        else if (item.data) acc.results.push(item.data);
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
