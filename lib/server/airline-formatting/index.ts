// import fs from "fs/promises";
// import path from "path";
// import * as XLSX from "xlsx";

// type CellValue = string | number | boolean | Date | null | undefined;
// type ExcelRow = Record<string, CellValue>;

// interface Destination {
//   FDestName?: string;
//   Airport?: string;
//   StationName?: string;
//   FromCode?: string;
//   ToCode?: string;
// }

// const destinationUrl = "https://shivent.azurewebsites.net/fdestination-list";
// const cachePath = path.join(process.cwd(), "data", "destination-list.xlsx");

// const normalize = (value: CellValue) =>
//   String(value ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, " ")
//     .trim();

// const compact = (value: CellValue) => normalize(value).replace(/ /g, "");

// const isToday = (date: Date) => {
//   const now = new Date();
//   return date.getUTCFullYear() === now.getUTCFullYear() &&
//     date.getUTCMonth() === now.getUTCMonth() &&
//     date.getUTCDate() === now.getUTCDate();
// };

// const writeWorkbook = async (destinations: Destination[]) => {
//   await fs.mkdir(path.dirname(cachePath), { recursive: true });
//   const worksheet = XLSX.utils.json_to_sheet(destinations);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Destinations");
//   await fs.writeFile(cachePath, XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
// };

// const readCachedDestinations = async () => {
//   const workbook = XLSX.read(await fs.readFile(cachePath), { type: "buffer" });
//   const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//   return XLSX.utils.sheet_to_json<Destination>(worksheet);
// };

// export const getDailyDestinations = async (): Promise<Destination[]> => {
//   try {
//     const stats = await fs.stat(cachePath);
//     if (isToday(stats.mtime)) return readCachedDestinations();
//   } catch {
//     // Cache is created on the first request.
//   }

//   const token = process.env.DESTINATION_API_TOKEN || "";
//   if (!token) throw new Error("DESTINATION_API_TOKEN is not configured");
//   const response = await fetch(destinationUrl, {
//     headers: { Authorization: `Bearer ${token}` },
//     cache: "no-store",
//   });
//   if (!response.ok) throw new Error(`Destination API returned ${response.status}`);

//   const payload = (await response.json()) as { Data?: Destination[] };
//   if (!Array.isArray(payload.Data)) throw new Error("Destination API returned no data");
//   await writeWorkbook(payload.Data);
//   return payload.Data;
// };

// const findKey = (row: ExcelRow, patterns: RegExp[]) =>
//   Object.keys(row).find((key) => patterns.some((pattern) => pattern.test(normalize(key))));

// const findDestination = (value: CellValue, destinations: Destination[]) => {
//   const normalized = normalize(value);
//   const compactValue = compact(value);
//   return destinations.find((destination) => {
//     const rawName = normalize(destination.FDestName);
//     const parts = rawName.split(" // ");
//     const from = normalize(destination.Airport ?? destination.StationName ?? parts[0]);
//     const to = normalize(parts[1] ?? destination.ToCode);
//     return normalized === rawName || normalized === `${from} ${to}` || compactValue === compact(`${from} ${to}`);
//   });
// };

// const findAirportCode = (value: CellValue, destinations: Destination[], side: "from" | "to") => {
//   const normalized = normalize(value);
//   return destinations.find((destination) => {
//     const rawName = normalize(destination.FDestName);
//     const parts = rawName.split(" // ");
//     const aliases = side === "from"
//       ? [destination.Airport, destination.StationName, parts[0]]
//       : [parts[1], destination.ToCode];
//     return aliases.some((alias) => normalize(alias) === normalized);
//   });
// };

// const formatRow = (
//   row: ExcelRow,
//   airline: "spicejet" | "indigo",
//   email: string,
//   destinations: Destination[],
// ) => {
//   const result = { ...row };
//   const sectorKey = findKey(result, [/sector/, /route/, /origin.*destination/, /from.*to/]);
//   const originKey = findKey(result, [/^origin$/, /^from$/, /departure.*airport/, /departure.*city/]);
//   const destinationKey = findKey(result, [/^destination$/, /^to$/, /arrival.*airport/, /arrival.*city/]);

//   if (originKey && destinationKey) {
//     const origin = findAirportCode(result[originKey], destinations, "from");
//     const destination = findAirportCode(result[destinationKey], destinations, "to");
//     if (origin?.FromCode) result[originKey] = origin.FromCode;
//     if (destination?.ToCode) result[destinationKey] = destination.ToCode;
//   } else if (sectorKey) {
//     const match = findDestination(result[sectorKey], destinations);
//     if (match?.FromCode && match.ToCode) result[sectorKey] = `${match.FromCode}-${match.ToCode}`;
//   }

//   const emailKeys = Object.keys(result).filter((key) => /e[- ]?mail/i.test(key));
//   emailKeys.forEach((key) => delete result[key]);
//   if (airline === "spicejet") result.Email = email;
//   return result;
// };

// export const formatAirlineWorkbook = async (
//   input: Buffer,
//   airline: "spicejet" | "indigo",
//   email: string,
// ) => {
//   const destinations = await getDailyDestinations();
//   const workbook = XLSX.read(input, { type: "buffer", cellDates: true });
//   const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//   if (!worksheet) throw new Error("The uploaded workbook has no worksheet");
//   const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });
//   const outputSheet = XLSX.utils.json_to_sheet(rows.map((row) => formatRow(row, airline, email, destinations)));
//   const outputWorkbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, "Formatted");
//   return XLSX.write(outputWorkbook, { type: "buffer", bookType: "xlsx" });
// };
import fs from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";

type CellValue = string | number | boolean | Date | null | undefined;
type ExcelRow = Record<string, CellValue>;

interface Destination {
  FDestName?: string;
  Airport?: string;
  StationName?: string;
  FromCode?: string;
  ToCode?: string;
}

const destinationUrl = "https://shivent.azurewebsites.net/fdestination-list";
const cachePath = path.join(process.cwd(), "data", "destination-list.xlsx");

// Helpers for string comparisons
const normalize = (value: CellValue) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Date and Time formatting handlers
const formatDate = (val: CellValue) => {
  if (!val) return "";
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${d}-${m}-${y}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\d{2}-\d{2}-\d{4})/);
  return match ? match[1] : str;
};

const formatTime = (val: CellValue) => {
  if (!val) return "";
  if (val instanceof Date) {
    const h = String(val.getUTCHours()).padStart(2, "0");
    const m = String(val.getUTCMinutes()).padStart(2, "0");
    // const s = String(val.getUTCSeconds()).padStart(2, "0");
    return `${h}:${m}`;
  }
  const str = String(val).trim();
//   const match = str.match(/(\d{2}:\d{2}:\d{2})/);
    const match = str.match(/(\d{2}:\d{2})/);
  return match ? match[1] : str;
};

const isToday = (date: Date) => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

// Caching functions
const writeWorkbook = async (destinations: Destination[]) => {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  const worksheet = XLSX.utils.json_to_sheet(destinations);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Destinations");
  await fs.writeFile(
    cachePath,
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
};

const readCachedDestinations = async () => {
  const workbook = XLSX.read(await fs.readFile(cachePath), { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Destination>(worksheet);
};

export const getDailyDestinations = async (): Promise<Destination[]> => {
  try {
    const stats = await fs.stat(cachePath);
    if (isToday(stats.mtime)) return readCachedDestinations();
  } catch {
    // Expected on the very first run if the file does not exist
  }

  // Fallback to "My Bearer Token" if env var is missing, though env var is highly recommended
  const token = process.env.DESTINATION_API_TOKEN || "My Bearer Token";
  const response = await fetch(destinationUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok)
    throw new Error(`Destination API returned ${response.status}`);

  const payload = (await response.json()) as { Data?: Destination[] };
  if (!Array.isArray(payload.Data))
    throw new Error("Destination API returned no data");

  await writeWorkbook(payload.Data);
  return payload.Data;
};

// Row Formatter
const formatRow = (
  row: ExcelRow,
  airline: "spicejet" | "indigo",
  email: string,
  destinations: Destination[],
) => {
  // Dynamically find columns in case of typos in the input file (e.g. "Desstination" -> "Destination")
  const destKey =
    Object.keys(row).find((k) => /dest.*tion|sector/i.test(k)) ||
    "Desstination";
  const pnrKey = Object.keys(row).find((k) => /pnr/i.test(k)) || "PNR";
  const flightKey = Object.keys(row).find((k) => /flight/i.test(k)) || "Flight";
  const dateKey =
    Object.keys(row).find((k) => /travel.*date/i.test(k)) || "Travel Date";
  const depKey = Object.keys(row).find((k) => /dep/i.test(k)) || "Dep.";
  const arrKey = Object.keys(row).find((k) => /arr/i.test(k)) || "Arr.";

  const rawDest = String(row[destKey] || "");
  let fromCode = "";
  let toCode = "";

  // Attempt 1: Look for exact match from the 'FDestName' API property
  const normalizedDest = normalize(rawDest);
  const exactMatch = destinations.find(
    (d) => normalize(d.FDestName) === normalizedDest,
  );

  if (exactMatch && exactMatch.FromCode && exactMatch.ToCode) {
    fromCode = exactMatch.FromCode;
    toCode = exactMatch.ToCode;
  } else {
    // Attempt 2: Split "Dubai // Delhi" and attempt independent lookups
    const parts = rawDest.split(/\s*(?:\/\/|-)\s*/);
    const rawFrom = parts[0] || "";
    const rawTo = parts[1] || "";

    const findCityCode = (cityName: string) => {
      const normCity = normalize(cityName);
      const match = destinations.find(
        (d) =>
          normalize(d.Airport) === normCity ||
          normalize(d.StationName) === normCity,
      );
      // Try to determine code by checking if it matches the FromCode or fall back to whatever is there
      if (match?.FromCode) return match.FromCode;
      if (match?.ToCode) return match.ToCode;
      return cityName; // Default back to raw city name if no mapping is found
    };

    fromCode = findCityCode(rawFrom);
    toCode = findCityCode(rawTo);
  }

  const rawFlight = String(row[flightKey] || "").trim();
  // Split by the '+' symbol and filter out any empty pieces
  const flightParts = rawFlight
    .split(/\s*\+\s*/)
    .filter((p) => p.trim() !== "");

  let flightRoute = "Non - Stop";
  if (flightParts.length === 2) {
    flightRoute = "1 Stop";
  } else if (flightParts.length > 2) {
    flightRoute = `${flightParts.length - 1} Stops`;
  }

  // Strictly define output shape to discard old keys
 const output: Record<string, string> = {
   "Sector From": fromCode.toUpperCase(),
   "Sector To": toCode.toUpperCase(),
   PNR: String(row[pnrKey] || ""),
   Flight: rawFlight,
   TravelDate: formatDate(row[dateKey]),
   Dep: formatTime(row[depKey]),
   Arr: formatTime(row[arrKey]),
   FlightRoute: flightRoute,
 };

  // Only append email for SpiceJet
  if (airline === "spicejet") {
    output["Email ID"] = email;
  }

  return output;
};

export const formatAirlineWorkbook = async (
  input: Buffer,
  airline: "spicejet" | "indigo",
  email: string,
) => {
  const destinations = await getDailyDestinations();

  // cellDates: true turns native excel date/time numbers into JS Date objects
  const workbook = XLSX.read(input, { type: "buffer", cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error("The uploaded workbook has no worksheet");

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

  // Format to standard structure
  const formattedRows = rows.map((row) =>
    formatRow(row, airline, email, destinations),
  );
  const outputSheet = XLSX.utils.json_to_sheet(formattedRows);
  const outputWorkbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, "Formatted");

  return XLSX.write(outputWorkbook, { type: "buffer", bookType: "xlsx" });
};