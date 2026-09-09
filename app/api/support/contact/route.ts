import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { isLocale } from "@/lib/site-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE = { "Cache-Control": "no-store" };

const CATEGORIES = ["technical", "feature", "bug", "general"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(1, "required").max(200),
  email: z.string().trim().min(3, "required").max(320).email("invalid_email"),
  subject: z.string().trim().min(1, "required").max(300),
  message: z.string().trim().min(1, "required").max(5000),
  category: z.enum(CATEGORIES).catch("general"),
  locale: z.string().max(10).optional(),
  // Honeypot field: real visitors never fill this in. Bots that
  // autofill every field will, and we silently drop those submissions.
  website: z.string().max(0).optional().or(z.literal("")),
});

/** One-way hash of the caller's IP, kept only to spot abuse — never the raw address. */
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Two layers: a tight per-minute limit to stop bursts, a looser per-hour
  // limit to stop slow-drip abuse from the same client.
  const minuteLimit = checkRateLimit(`support:${ip}:m`, 3, 60_000);
  if (!minuteLimit.allowed) {
    return NextResponse.json({ status: "rate_limited", message: "Too many requests. Please wait a moment and try again." }, { status: 429, headers: NO_STORE });
  }
  const hourLimit = checkRateLimit(`support:${ip}:h`, 10, 60 * 60_000);
  if (!hourLimit.allowed) {
    return NextResponse.json({ status: "rate_limited", message: "Too many requests. Please try again later." }, { status: 429, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid", message: "Malformed request." }, { status: 400, headers: NO_STORE });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", message: "Please complete the required fields with a valid email address." }, { status: 400, headers: NO_STORE });
  }
  const { name, email, subject, message, category, locale, website } = parsed.data;

  // Honeypot tripped: pretend success so the bot moves on, but write nothing.
  if (website) {
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("support_messages").insert({
      name,
      email,
      subject,
      category,
      message,
      locale: locale && isLocale(locale) ? locale : null,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      ip_hash: ip === "unknown" ? null : hashIp(ip),
    });
    if (error) throw error;
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  } catch (err) {
    const isConfigError = err instanceof Error && err.message.includes("not configured");
    if (isConfigError) {
      return NextResponse.json(
        { status: "not_configured", message: "Support storage is not configured yet. Please email us directly." },
        { status: 503, headers: NO_STORE },
      );
    }
    return NextResponse.json({ status: "error", message: "Something went wrong. Please try again in a moment." }, { status: 500, headers: NO_STORE });
  }
}
