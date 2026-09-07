import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { testConnection } from "@/lib/ga4/client";

export async function POST() {
  const session = await auth();
  if (!session || !isAdminEmail(session.user.email) || session.user.role !== "admin") {
    return NextResponse.json({ status: "unauthorized", message: "You don't have permission to do this." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const { allowed } = checkRateLimit(`test-connection:${session.user.email ?? "unknown"}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ status: "rate_limited", message: "Too many attempts. Please wait a moment." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  const result = await testConnection();
  return NextResponse.json({ ...result, testedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
