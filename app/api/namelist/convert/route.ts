import { NextRequest, NextResponse } from "next/server";
import {
  getAirlineName,
  logFileAction,
  readExcelData,
  transformData,
  writeExcelFile,
} from "@/lib/server/excel-helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Assuming the frontend appends the file with key "file" or "PNR"
    // Adjust "file" to match your frontend formData.append("file", file)
    const file = (formData.get("file") || formData.get("PNR")) as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fullName = file.name; // e.g., "ATU87B i.xlsx" or "12312--ATU87B i.xlsx"

    // Logic to extract PNR and Airline Code
    // 1. Handle potential Multer/Timestamp prefixes (split by "--")
    const fullNameParts = fullName.includes("--")
      ? fullName.split("--")
      : [null, fullName];

    // 2. Get the actual PNR filename (e.g., "ATU87B i.xlsx")
    const fullPnr = fullNameParts[1] || fullNameParts[0] || fullName;

    // 3. Split by space to get [PNR, Code] -> ["ATU87B", "i.xlsx"]
    const finalName = fullPnr.split(" ");

    if (finalName.length < 2) {
      throw new Error("Invalid filename format. Expected 'PNR CODE.xlsx'");
    }

    const pnrNumber = finalName[0];
    const airlineCode = finalName[1].toLowerCase(); // e.g. "i.xlsx"
    const airlineName = getAirlineName(airlineCode);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read Data (Passing Buffer now, not file path)
    const jsonSheet = readExcelData(buffer, "Sheet1");

    // Transform
    const transformedData = transformData(jsonSheet, airlineCode);

    // Write New Excel to Buffer
    const outputBuffer = writeExcelFile(transformedData);

    // Log action
    logFileAction(pnrNumber, airlineName);

    // Create Headers for Download
    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${pnrNumber} ${airlineName} NAMELIST.xlsx"`
    );

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Convert Route Error:", error);
    return NextResponse.json(
      { error: "Error Converting File", details: error.message },
      { status: 500 }
    );
  }
}
