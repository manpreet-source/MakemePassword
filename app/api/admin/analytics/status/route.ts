import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/lib/auth";
import { ga4Configured } from "@/lib/ga4/client";

export async function GET() {
  const session = await auth();
  if (!session || !isAdminEmail(session.user.email) || session.user.role !== "admin") {
    return NextResponse.json({ status: "unauthorized" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    {
      ga4Configured: ga4Configured(),
      measurementIdConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
