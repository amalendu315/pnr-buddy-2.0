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

  const cleanText = String(text).trim();

  // Try parsing with moment first
  const parsed = moment(cleanText, [
    "HH:mm",
    "hh:mm A",
    "h:mm A",
    "HH:mm:ss",
    "hh:mma",
    "h:mma",
  ]);
  if (parsed.isValid()) {
    // 'HH' gives 24-hour format (00-23), 'A' appends the AM/PM tag
    return parsed.format("HH:mm A");
  }

  // Manual fallback for weird edge cases
  const parts = cleanText.split(":");
  if (parts.length < 2) return cleanText;

  let hour = parseInt(parts[0], 10) || 0;
  const minuteStr = parts[1].replace(/[^0-9]/g, "");
  const minute = parseInt(minuteStr, 10) || 0;

  const isPM = cleanText.toLowerCase().includes("pm");
  const isAM = cleanText.toLowerCase().includes("am");

  // Standardize to 24-hour format
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  // Determine AM/PM based on the 24-hour time
  const ampm = hour >= 12 ? "PM" : "AM";

  // Return the exact 24-hour hour, minutes, and the AM/PM tag
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}${ampm}`;
};

// HELPER: Format Time from Excel Input
const formatExcelTime = (inputTime: any) => {
  if (inputTime === null || inputTime === undefined || inputTime === "") return "";

  let date;

  // Case 1: Excel parses time as a fraction of a 24-hour day (e.g. 0.5 = 12:00 PM)
  if (typeof inputTime === "number") {
    const totalMinutes = Math.round(inputTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    date = moment.utc().hours(hours).minutes(mins).seconds(0);
  }
  // Case 2: Input is already a string ("14:30", "02:30 PM")
  else if (typeof inputTime === "string") {
    return checkTimeFormat(inputTime);
  }
  // Case 3: JS Date object from XLSX with cellDates: true
  else if (inputTime instanceof Date) {
    date = moment.utc(inputTime);
  }
  // Fallback
  else {
    date = moment.utc(inputTime);
  }

  if (!date || !date.isValid()) {
    return "";
  }

  // Rounding Logic
  const minute = date.minutes();
  const lastDigit = minute % 10;
  const roundedMinutes =
      lastDigit === 0 || lastDigit === 5 ? minute : minute + 1;

  date.minutes(roundedMinutes);

  return date.format("HH:mm");
};

// HELPER: Format Date from Excel Input
const formatExcelDate = (inputDate: any) => {
  if (!inputDate) return "";

  // 1. Strings (e.g., "2026-03-22")
  if (typeof inputDate === "string") {
    const match = inputDate.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0]; // Safely grab YYYY-MM-DD directly

    const parsed = moment(inputDate);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(inputDate);
  }

  // 2. Excel Raw Numbers
  if (typeof inputDate === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + inputDate * 86400000);
    return moment.utc(date).format("YYYY-MM-DD");
  }

  // 3. JS Date Objects (The cause of the bug)
  if (inputDate instanceof Date) {
    // Generate both possible representations
    const localDateStr = moment(inputDate).format("YYYY-MM-DD");
    const utcDateStr = moment.utc(inputDate).format("YYYY-MM-DD");

    // If it was parsed by the CSV reader at Local Midnight (e.g., IST 00:00),
    // it belongs to the local day string.
    if (inputDate.getHours() === 0) {
      return localDateStr;
    }

    // If it was parsed by an Excel reader at UTC Midnight (e.g., UTC 00:00),
    // it belongs to the UTC day string.
    if (inputDate.getUTCHours() === 0) {
      return utcDateStr;
    }

    // Fallback: Safely push negative timezones into the middle of the correct day
    return moment.utc(inputDate).add(12, 'hours').format("YYYY-MM-DD");
  }

  return String(inputDate);
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
            const OldDate = formatExcelDate(record.TravelDate);

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
          const depDate = formatExcelDate(depDetails[0]);
          const depTime = checkTimeFormat(depDetails[1].substring(0, 5));

          const arrDetails = designator.arrival.split("T");
          const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));

          const PAX = Object.keys(bookingData.passengers).length;

          // --- COMPARISON LOGIC (RESTORED) ---
          const OldPur = JSON.stringify(record.Pur);

          // Apply same helper to SpiceJet excel inputs
          const OldDep = formatExcelTime(record.Dep);
          const OldArr = formatExcelTime(record.Arr);
          const OldDate = formatExcelDate(record.TravelDate);
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
