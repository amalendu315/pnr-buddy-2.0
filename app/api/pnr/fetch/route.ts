// import { NextRequest, NextResponse } from "next/server";
// import fs from "fs/promises";
// import path from "path";
// import https from "https";
// import axios, { AxiosResponse } from "axios";

// // ADJUST IMPORT PATH: Ensure this points to your actual constants file
// // If using standard Next.js aliases, '@/constants' usually works.
// // Otherwise, use relative paths like "../../../../constants"
// import {
//   akasaPnrRetrieveUrl,
//   akasaTokenUrl,
//   spicejetPnrRetrieveUrl,
//   spicejetTokenUrl,
// } from "@/constants";

// // ==========================================
// // SHARED UTILITIES
// // ==========================================

// const checkTimeFormat = (text: string): string => {
//   if (
//     text.charAt(0) === "0" ||
//     text.slice(0, 2) === "11" ||
//     text.slice(0, 2) === "10"
//   ) {
//     return text.concat(" ", "AM");
//   } else {
//     return text.concat(" ", "PM");
//   }
// };

// // Helper to safely write to file (Server-side only)
// // Note: In Vercel/Serverless, the filesystem is ephemeral.
// // It's better to rely on the API response, but this is kept for VPS compatibility.
// const appendToLogFile = async (text: string) => {
//   try {
//     const downloadDir = path.join(process.cwd(), "downloads");
//     // Ensure directory exists
//     try {
//       await fs.access(downloadDir);
//     } catch {
//       await fs.mkdir(downloadDir, { recursive: true });
//     }
//     await fs.appendFile(path.join(downloadDir, "data.txt"), text, "utf8");
//   } catch (err) {
//     console.warn("Failed to write to local log file:", err);
//   }
// };

// // ==========================================
// // AKASA LOGIC
// // ==========================================

// const AkasaTokenConfig = {
//   method: "post",
//   url: akasaTokenUrl,
//   headers: {
//     "Content-Type": "application/json",
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//   },
//   data: JSON.stringify({ clientType: "WEB" }),
//   httpsAgent: new https.Agent({ rejectUnauthorized: false }),
// };

// async function fetchAkasaToken(
//   maxAttempts: number,
//   currentAttempt = 1
// ): Promise<AxiosResponse> {
//   return axios(AkasaTokenConfig)
//     .then((response) => {
//       if (response.data.data.token && response.data.data.token.length > 0) {
//         return response.data;
//       } else if (currentAttempt < maxAttempts) {
//         console.log(
//           `Akasa Token Attempt ${currentAttempt} failed. Retrying...`
//         );
//         return fetchAkasaToken(maxAttempts, currentAttempt + 1);
//       } else {
//         throw new Error("Maximum number of attempts reached for Akasa Token");
//       }
//     })
//     .catch((error) => {
//       console.error(
//         "Error fetching Akasa token:",
//         error.response ? error.response.data : error.message
//       );
//       if (currentAttempt < maxAttempts) {
//         return fetchAkasaToken(maxAttempts, currentAttempt + 1);
//       } else {
//         throw new Error("Maximum number of attempts reached after error");
//       }
//     });
// }

// async function processAkasaPnrs(pnrs: string[]) {
//   const data = await fetchAkasaToken(10);
//   const myToken = data.data.token;
//   const header = `Bearer ${myToken}`;

//   const results: string[] = [];
//   const errors: string[] = [];

//   await Promise.all(
//     pnrs.map(async (pnr) => {
//       try {
//         const config1 = {
//           method: "get",
//           url: `${akasaPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=Airlines@Airiq.In`,
//           headers: {
//             Authorization: header,
//             "Content-Type": "application/json",
//             "User-Agent":
//               "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//           },
//           httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//         };

//         const config2 = {
//           method: "get",
//           url: `${akasaPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=INFO.AIRIQ1@GMAIL.COM`,
//           headers: {
//             Authorization: header,
//             "Content-Type": "application/json",
//             "User-Agent":
//               "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//           },
//           httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//         };

//         let response: AxiosResponse<any>;
//         try {
//           response = await axios(config1);
//         } catch (error) {
//           response = await axios(config2);
//         }

//         const bookingData = response?.data.data;

//         if (bookingData?.journeys.length > 0) {
//           const Destination = bookingData.journeys[0].designator.destination;
//           const Origin = bookingData.journeys[0].designator.origin;
//           const depDate = bookingData.journeys[0].designator.departure.slice(
//             0,
//             10
//           );
//           const arrTime = checkTimeFormat(
//             bookingData.journeys[0].designator.arrival.slice(11, 16)
//           );
//           const depTime = checkTimeFormat(
//             bookingData.journeys[0].designator.departure.slice(11, 16)
//           );
//           const pax =
//             "PAX " + Object.keys(bookingData.breakdown.passengers).length;
//           const cost = bookingData.breakdown.totalAmount;
//           const PNR = bookingData.recordLocator;

//           const flightReference =
//             bookingData.journeys[0].segments[0].flightReference;
//           const qpCodeRegex = /QP(\d+)/;
//           const match = flightReference.match(qpCodeRegex);
//           const FlightNo = match ? match[1] : null;

//           const result = `${PNR}|${Origin}|${Destination}|${FlightNo}|${depDate}|${depTime}|${arrTime}|${pax}|${cost}|Airlines@Airiq.In`;
//           results.push(result);

//           // Log to file if needed
//           await appendToLogFile(`${result.replace(/\|/g, " ")}\n`);
//         } else {
//           const PNR = bookingData.recordLocator;
//           const result = `${PNR} is Cancelled`;
//           results.push(result);
//           await appendToLogFile(`${result}\n`);
//         }
//       } catch (error: any) {
//         if (error?.response?.status === 404) {
//           errors.push(`PNR ${pnr} not found`);
//         } else {
//           errors.push(`Error processing PNR ${pnr}: ${error?.message}`);
//         }
//       }
//     })
//   );
//   return { results, errors };
// }

// // ==========================================
// // SPICEJET LOGIC
// // ==========================================

// const SpiceJetTokenConfig = {
//   method: "post",
//   url: spicejetTokenUrl,
//   headers: { "Content-Type": "application/json" },
// };

// async function fetchSpiceJetToken(
//   maxAttempts: number,
//   currentAttempt = 1
// ): Promise<AxiosResponse<any>> {
//   return axios(SpiceJetTokenConfig)
//     .then((response) => {
//       // Check standard data path for SpiceJet token
//       const token =
//         response.data?.data?.token || response.data?.data?.data?.token;
//       if (token && token.length > 0) {
//         return response;
//       } else if (currentAttempt < maxAttempts) {
//         return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
//       } else {
//         throw new Error("Maximum number of attempts reached for SpiceJet");
//       }
//     })
//     .catch((error) => {
//       console.log("Trying To Fetch SpiceJet Authorization Key");
//       if (currentAttempt < maxAttempts) {
//         return fetchSpiceJetToken(maxAttempts, currentAttempt + 1);
//       } else {
//         throw new Error("Maximum attempts reached for SpiceJet Token");
//       }
//     });
// }

// async function processSpiceJetPnrs(pnrs: string[]) {
//   const data = await fetchSpiceJetToken(10);
//   // Safely access token
//   const myToken =
//     data.data?.data?.token || data.data?.data?.data?.token || data.data?.token;

//   const results: string[] = [];
//   const errors: string[] = [];

//   const emailAddresses = [
//     "airlines@airiq.in",
//     "info.airiq@gmail.com",
//     "accounts@airiq.in",
//     "airlines.reco@airiq.in",
//     "chitra@airiq.in",
//     "hafiz@trinityairtravel.com",
//     "gulf1@trinityairtravel.com",
//     "support@vishaltravels.in",
//   ];

//   await Promise.all(
//     pnrs.map(async (pnr) => {
//       let success = false;

//       for (const email of emailAddresses) {
//         const config = {
//           method: "post",
//           url: `${spicejetPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=${email}`,
//           headers: {
//             Authorization: myToken,
//             "Content-Type": "application/json",
//           },
//         };

//         try {
//           const response = await axios(config);
//           const bookingData = response?.data.bookingData;

//           if (bookingData?.journeys?.length > 0) {
//             const IdType = bookingData.contacts.P.sourceOrganization;
//             const Email = bookingData.contacts.P.emailAddress;
//             const designator = bookingData.journeys[0].designator;
//             const flightNumber =
//               bookingData.journeys[0].segments[0].identifier.identifier;
//             const depSector = designator.origin;
//             const arrSector = designator.destination;
//             const depDetails = designator.departure.split("T");
//             const depTime = checkTimeFormat(depDetails[1].substring(0, 5));
//             const arrDetails = designator.arrival.split("T");
//             const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));
//             const depDate = depDetails[0];
//             const paxCount =
//               "PAX " + Object.keys(bookingData.passengers).length;
//             const PNR = bookingData.recordLocator;
//             const payment = bookingData.breakdown.totalCharged;

//             const result = `${PNR}|${depSector}|${arrSector}|${flightNumber}|${depDate}|${depTime}|${arrTime}|${paxCount}|${payment}|${IdType}|${Email}`;
//             results.push(result);

//             await appendToLogFile(`${result.replace(/\|/g, " ")}\n`);
//             success = true;
//             break;
//           } else {
//             const PNR = bookingData?.recordLocator;
//             const Email = bookingData?.contacts?.P?.emailAddress || email;
//             const result = `${PNR}| is cancelled`;

//             results.push(result);
//             await appendToLogFile(`${PNR} is cancelled ${Email}\n`);
//             success = true;
//             break;
//           }
//         } catch (error: any) {
//           if (error?.response?.status === 404) {
//             continue; // Try next email
//           }
//           console.error(`Attempt with ${email} failed:`, error.message);
//         }
//       }

//       if (!success) {
//         errors.push(`All attempts failed for PNR ${pnr}`);
//       }
//     })
//   );

//   return { results, errors };
// }

// // ==========================================
// // MAIN ROUTE HANDLER
// // ==========================================

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { pnrs, airline } = body;

//     if (!pnrs || !Array.isArray(pnrs) || pnrs.length === 0) {
//       return NextResponse.json({ error: "Invalid PNR list" }, { status: 400 });
//     }

//     // Determine which airline logic to run
//     let processingResult;

//     // Normalize airline string
//     const airlineKey = airline ? airline.toLowerCase().trim() : "";

//     if (airlineKey.includes("akasa") || airlineKey === "qp") {
//       processingResult = await processAkasaPnrs(pnrs);
//     } else if (airlineKey.includes("spice") || airlineKey === "sg") {
//       processingResult = await processSpiceJetPnrs(pnrs);
//     } else {
//       return NextResponse.json(
//         {
//           error:
//             "Unknown or missing airline provided. Please specify 'akasa' or 'spicejet'.",
//         },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       results: processingResult.results.join("\n"),
//       errors: processingResult.errors,
//     });
//   } catch (error: any) {
//     console.error("API Error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error", details: error.message },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import https from "https";
import axios, { AxiosResponse } from "axios";
import { getStoredEmails } from "@/lib/server/email-manager"; // Import the helper

import {
  akasaPnrRetrieveUrl,
  akasaTokenUrl,
  spicejetPnrRetrieveUrl,
  spicejetTokenUrl,
} from "@/constants";

// ... [Keep checkTimeFormat and appendToLogFile EXACTLY AS BEFORE] ...

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

const appendToLogFile = async (text: string) => {
  try {
    const downloadDir = path.join(process.cwd(), "downloads");
    try {
      await fs.access(downloadDir);
    } catch {
      await fs.mkdir(downloadDir, { recursive: true });
    }
    await fs.appendFile(path.join(downloadDir, "data.txt"), text, "utf8");
  } catch (err) {
    console.warn("Failed to write to local log file:", err);
  }
};

// ... [Keep Akasa Logic EXACTLY AS BEFORE] ...

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
  // ... [Copy your existing fetchAkasaToken code here] ...
  // For brevity, assuming you paste the function body from your previous code
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

// Updated Process Akasa to use email list (Optional: Akasa usually only allows registered agents,
// but if you want to support custom emails for Akasa too, pass the list here like SpiceJet)
async function processAkasaPnrs(pnrs: string[], emailList: string[]) {
  const data = await fetchAkasaToken(10);
  const myToken = data.data.token;
  const header = `Bearer ${myToken}`;

  const results: string[] = [];
  const errors: string[] = [];

  // Note: Akasa usually requires specific registered emails.
  // If you want to cycle through emails for Akasa, logic needs to change similar to SpiceJet.
  // Keeping your original logic but adding custom email support if needed.

  await Promise.all(
    pnrs.map(async (pnr) => {
      try {
        // We will try the Custom Email first if provided, then default
        const emailsToTry = [
          ...emailList,
          "Airlines@Airiq.In",
          "INFO.AIRIQ1@GMAIL.COM",
        ];
        // Removing duplicates
        const uniqueEmails = [...new Set(emailsToTry)];

        let bookingData: any = null;

        for (const email of uniqueEmails) {
          const config = {
            method: "get",
            url: `${akasaPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=${email}`,
            headers: {
              Authorization: header,
              "Content-Type": "application/json",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          };

          try {
            const response = await axios(config);
            if (response?.data?.data) {
              bookingData = response.data.data;
              break; // Found it
            }
          } catch (e) {
            // Continue
          }
        }

        if (bookingData?.journeys.length > 0) {
          // ... [Copy your Akasa Mapping Logic from previous code] ...
          // It's a bit long, so ensure you copy the lines:
          // const Destination = bookingData.journeys[0].designator.destination;
          // ... down to ...
          // await appendToLogFile(`${result.replace(/\|/g, " ")}\n`);

          // RE-INSERT YOUR MAPPING LOGIC HERE
          const Destination = bookingData.journeys[0].designator.destination;
          const Origin = bookingData.journeys[0].designator.origin;
          const depDate = bookingData.journeys[0].designator.departure.slice(
            0,
            10
          );
          const arrTime = checkTimeFormat(
            bookingData.journeys[0].designator.arrival.slice(11, 16)
          );
          const depTime = checkTimeFormat(
            bookingData.journeys[0].designator.departure.slice(11, 16)
          );
          const pax =
            "PAX " + Object.keys(bookingData.breakdown.passengers).length;
          const cost = bookingData.breakdown.totalAmount;
          const PNR = bookingData.recordLocator;
          const flightReference =
            bookingData.journeys[0].segments[0].flightReference;
          const qpCodeRegex = /QP(\d+)/;
          const match = flightReference.match(qpCodeRegex);
          const FlightNo = match ? match[1] : null;
          const result = `${PNR}|${Origin}|${Destination}|${FlightNo}|${depDate}|${depTime}|${arrTime}|${pax}|${cost}|Airlines@Airiq.In`;
          results.push(result);
          await appendToLogFile(`${result.replace(/\|/g, " ")}\n`);
        } else {
          const result = `${pnr} is Cancelled or Not Found`;
          results.push(result);
          await appendToLogFile(`${result}\n`);
        }
      } catch (error: any) {
        errors.push(`Error processing PNR ${pnr}: ${error?.message}`);
      }
    })
  );
  return { results, errors };
}

// ==========================================
// SPICEJET LOGIC
// ==========================================

// ... [Keep fetchSpiceJetToken EXACTLY AS BEFORE] ...
const SpiceJetTokenConfig = {
  method: "post",
  url: spicejetTokenUrl,
  headers: { "Content-Type": "application/json" },
};

async function fetchSpiceJetToken(
  maxAttempts: number,
  currentAttempt = 1
): Promise<AxiosResponse<any>> {
  // ... Copy existing body ...
  return axios(SpiceJetTokenConfig)
    .then((response) => {
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
        throw new Error("Maximum attempts reached for SpiceJet Token");
      }
    });
}

// UPDATE: Accept emailList argument
async function processSpiceJetPnrs(pnrs: string[], emailList: string[]) {
  const data = await fetchSpiceJetToken(10);
  const myToken =
    data.data?.data?.token || data.data?.data?.data?.token || data.data?.token;

  const results: string[] = [];
  const errors: string[] = [];

  // Use the passed email list (which includes custom + stored)
  const emailAddresses = emailList;

  await Promise.all(
    pnrs.map(async (pnr) => {
      let success = false;

      for (const email of emailAddresses) {
        const config = {
          method: "post",
          url: `${spicejetPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=${email}`,
          headers: {
            Authorization: myToken,
            "Content-Type": "application/json",
          },
        };

        try {
          const response = await axios(config);
          const bookingData = response?.data.bookingData;

          if (bookingData?.journeys?.length > 0) {
            // ... [Copy your SpiceJet Mapping Logic EXACTLY AS BEFORE] ...
            const IdType = bookingData.contacts.P.sourceOrganization;
            const Email = bookingData.contacts.P.emailAddress;
            const designator = bookingData.journeys[0].designator;
            const flightNumber =
              bookingData.journeys[0].segments[0].identifier.identifier;
            const depSector = designator.origin;
            const arrSector = designator.destination;
            const depDetails = designator.departure.split("T");
            const depTime = checkTimeFormat(depDetails[1].substring(0, 5));
            const arrDetails = designator.arrival.split("T");
            const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));
            const depDate = depDetails[0];
            const paxCount =
              "PAX " + Object.keys(bookingData.passengers).length;
            const PNR = bookingData.recordLocator;
            const payment = bookingData.breakdown.totalCharged;

            const result = `${PNR}|${depSector}|${arrSector}|${flightNumber}|${depDate}|${depTime}|${arrTime}|${paxCount}|${payment}|${IdType}|${Email}`;
            results.push(result);

            await appendToLogFile(`${result.replace(/\|/g, " ")}\n`);
            success = true;
            break;
          } else {
            const PNR = bookingData?.recordLocator;
            const Email = bookingData?.contacts?.P?.emailAddress || email;
            const result = `${PNR}| is cancelled`;
            results.push(result);
            await appendToLogFile(`${PNR} is cancelled ${Email}\n`);
            success = true;
            break;
          }
        } catch (error: any) {
          if (error?.response?.status === 404) {
            continue;
          }
        }
      }

      if (!success) {
        errors.push(`All attempts failed for PNR ${pnr}`);
      }
    })
  );

  return { results, errors };
}

// ==========================================
// MAIN ROUTE HANDLER
// ==========================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pnrs, airline, customEmail } = body; // Get customEmail from body

    if (!pnrs || !Array.isArray(pnrs) || pnrs.length === 0) {
      return NextResponse.json({ error: "Invalid PNR list" }, { status: 400 });
    }

    // 1. Get Stored Emails from File
    const storedEmails = await getStoredEmails();

    // 2. Prepare Email List: Custom Email (if exists) -> Stored Emails
    let emailList = [...storedEmails];
    if (customEmail && customEmail.trim() !== "") {
      // Add custom email to the FRONT of the array so it's checked first
      emailList = [customEmail.trim(), ...storedEmails];
    }
    // Remove duplicates
    emailList = [...new Set(emailList)];

    let processingResult;
    const airlineKey = airline ? airline.toLowerCase().trim() : "";

    if (airlineKey.includes("akasa") || airlineKey === "qp") {
      // Pass email list to Akasa too
      processingResult = await processAkasaPnrs(pnrs, emailList);
    } else if (airlineKey.includes("spice") || airlineKey === "sg") {
      processingResult = await processSpiceJetPnrs(pnrs, emailList);
    } else {
      return NextResponse.json({ error: "Unknown airline." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      results: processingResult.results.join("\n"),
      errors: processingResult.errors,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}