// import { NextRequest, NextResponse } from "next/server";
// import { formatAirlineWorkbook } from "@/lib/server/airline-formatting";

// export const runtime = "nodejs";

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get("file");
//     const airline = formData.get("airline");
//     const email = String(formData.get("email") ?? "").trim();

//     if (!(file instanceof File)) {
//       return NextResponse.json({ error: "Please upload an Excel file" }, { status: 400 });
//     }
//     if (airline !== "spicejet" && airline !== "indigo") {
//       return NextResponse.json({ error: "Please select SpiceJet or Indigo" }, { status: 400 });
//     }
//     if (airline === "spicejet" && !email) {
//       return NextResponse.json({ error: "Email is required for SpiceJet" }, { status: 400 });
//     }

//     const output = await formatAirlineWorkbook(
//       Buffer.from(await file.arrayBuffer()),
//       airline,
//       email,
//     );
//     const filename = `${airline === "spicejet" ? "SpiceJet" : "Indigo"}-formatted.xlsx`;

//     return new NextResponse(output as BodyInit, {
//       headers: {
//         "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         "Content-Disposition": `attachment; filename="${filename}"`,
//       },
//     });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Unable to format workbook";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { formatAirlineWorkbook } from "@/lib/server/airline-formatting";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const airline = formData.get("airline");
    const email = String(formData.get("email") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an Excel file" },
        { status: 400 },
      );
    }
    if (airline !== "spicejet" && airline !== "indigo") {
      return NextResponse.json(
        { error: "Please select SpiceJet or Indigo" },
        { status: 400 },
      );
    }
    if (airline === "spicejet" && !email) {
      return NextResponse.json(
        { error: "Email is required for SpiceJet" },
        { status: 400 },
      );
    }

    const output = await formatAirlineWorkbook(
      Buffer.from(await file.arrayBuffer()),
      airline,
      email,
    );

    const filename = `${airline === "spicejet" ? "SpiceJet" : "Indigo"}-formatted.xlsx`;

    return new NextResponse(output as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to format workbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}