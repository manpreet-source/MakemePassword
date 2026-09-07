# MakeMePassword

MakeMePassword is a local-first username and password generator with a private,
authenticated admin analytics dashboard built on Google Analytics 4 (GA4).

## Run locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

## The public product

- Cryptographically secure passwords via `crypto.getRandomValues()` (see `lib/generators`).
- Username styles for memorable, gaming, professional, anonymous, minimal, and random results.
- Password presets (Easy, Strong, Very Strong, Maximum Strength, Wi-Fi, Developer, Random) and an
  advanced-options panel (avoid repeated/sequential characters, pronounceable, minimum digits/symbols).
- Local username and password checkers with strength levels, reasons, and recommendations. Checked
  and generated values never leave the browser.
- Responsive layout, dark mode, and an analytics consent banner.

None of this requires the admin dashboard to be configured — the generator and checker work fully
offline with no server credentials.

## Analytics

GA4 is loaded client-side only after the visitor accepts the consent banner, via
`lib/analytics/gtag.ts`. All product events are emitted through `lib/analytics/events.ts`'s
`track()` function, which:

- No-ops until consent is accepted (`hasAnalyticsConsent()`).
- Throws if a caller ever tries to attach a parameter named `username`, `password`, `credential`,
  `clipboard`, `value`, or `text` — a defense-in-depth guard against accidentally sending sensitive
  data, on top of only ever passing safe metadata like `generator_type` or `length_bucket`.

See `docs/analytics-events.md` for the full event contract, and set `NEXT_PUBLIC_GA_MEASUREMENT_ID`
to your GA4 measurement ID to enable it. This value is public by design (it's the same ID GA4's own
browser snippet embeds); never put Data API credentials in it or in any other `NEXT_PUBLIC_*` variable.

## Admin analytics dashboard

`/admin` is a protected dashboard for the site owner: traffic, audience, geography, devices,
browsers, popular pages, events/engagement, generator usage, and realtime active users, all backed
by the Google Analytics Data API. Architecture:

```text
Authenticated admin browser
        |
        v
/api/admin/analytics/* (this server)
        |
        v
Google Analytics Data API
```

The browser never receives Google API credentials. Every request under `/api/admin/analytics/*`:

1. Requires a NextAuth session via Google OAuth, scoped to `ADMIN_EMAIL`.
2. Re-checks the admin role server-side (never trusts the client).
3. Validates report name and date-range parameters.
4. Is rate-limited per admin (60 requests/minute for reports, 10/minute for connection tests).
5. Queries GA4 through `lib/ga4/client.ts`, cached in-process for 2 minutes to avoid hammering the
   Data API on every dashboard refresh.
6. Returns only aggregated, named JSON (see `lib/ga4/shape.ts`) — never the raw Google API response,
   and never anything that could identify an individual visitor.

If GA4 isn't configured yet, every page shows a "setup required" state instead of fabricated
numbers. If a report legitimately has no data for the selected range, it shows "No analytics data
available for this period." instead of a fake chart.

### Setting it up

1. Create a Google OAuth web client and set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and a long
   random `AUTH_SECRET`.
2. Add the authorized administrator email(s) to `ADMIN_EMAIL` (comma-separated).
3. Create a GA4 property, set `GA_PROPERTY_ID`, and grant the service account below Viewer access
   to that property.
4. Create a Google Cloud service account with the Analytics Data API enabled, and set
   `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — server-only secrets,
   never committed to git or exposed as `NEXT_PUBLIC_*`.
5. Configure the OAuth callback URL as `https://<your-domain>/api/auth/callback/google`.
6. Open `/admin`, sign in with an allowlisted Google account, and use **Test analytics connection**
   on the Settings page to confirm connectivity.

`.env.example` lists every variable; see it for the exact names.

### Verifying the setup end to end

1. Open the public site and accept the analytics consent banner.
2. Generate a username, then a password.
3. Open GA4 → Reports → Realtime (or DebugView).
4. Confirm `username_generated` and `password_generated` arrived, and that neither event's
   parameters contain the generated value.
5. Sign in to `/admin` with an allowlisted account and confirm the dashboard shows the same
   aggregated activity (it can take a few minutes for GA4 to move realtime data into standard
   reports).

## Security notes

- `/admin` and `/api/admin/*` send `X-Robots-Tag: noindex, nofollow` (see `next.config.ts`) and are
  disallowed in `app/robots.ts`, so they're never indexed or listed in the public sitemap.
- Admin sessions expire after 8 hours (`lib/auth.ts`).
- Authorization is enforced server-side on every page and API route — there is no client-only
  gate an attacker could bypass by calling the API directly.

## Tests

```sh
npm run typecheck
npm run lint
npm test
```

Unit tests cover the generators, checkers, admin allowlist logic, date-range resolution, GA4
response shaping, and the analytics consent/track guard (`tests/`).
