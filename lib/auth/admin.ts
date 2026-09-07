/**
 * Pure admin-allowlist helpers, kept separate from lib/auth.ts so they can be
 * unit tested without constructing a full NextAuth instance.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && adminEmails().length);
}
