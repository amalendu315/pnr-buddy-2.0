import { NextRequest, NextResponse } from "next/server";
import {
  getStoredEmails,
  saveEmail,
  deleteEmail,
} from "@/lib/server/email-manager";

export async function GET() {
  const emails = await getStoredEmails();
  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: "Email required" }, { status: 400 });

  const updated = await saveEmail(email);
  return NextResponse.json({ emails: updated });
}

export async function DELETE(req: NextRequest) {
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: "Email required" }, { status: 400 });

  const updated = await deleteEmail(email);
  return NextResponse.json({ emails: updated });
}
