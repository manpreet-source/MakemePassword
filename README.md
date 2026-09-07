# MakeMePassword

MakeMePassword is a local-first username and password generator. The public experience is dependency-free HTML, CSS, and JavaScript so it can be deployed to any static host.

## Run locally

```sh
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Included

- Cryptographically secure passwords via `crypto.getRandomValues()`.
- Username styles for memorable, gaming, professional, anonymous, minimal, and random results.
- Password length, symbols, lookalike exclusion, show/hide, copy, and regeneration controls.
- Combined generation without storing credential values, including a Copy both action.
- Local username and password checkers with strength levels, reasons, recommendations, and password visibility controls.
- Responsive layout, dark mode, keyboard-friendly native controls, reduced dependency surface, and accessible live regions.
- SEO title, description, Open Graph metadata, canonical URL, `robots.txt`, and `sitemap.xml`.
- Privacy-safe GA4 event hooks. Events include action metadata and never include generated values or clipboard contents.

## GA4 setup

The app exposes `safeEvent()` in `app.js`. Add the GA4 browser tag only after implementing the consent choice required for your audience. The public measurement ID may be configured through your host's build process; never put Data API credentials in browser code.

Example tag, placed after consent and with your own measurement ID:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
</script>
```

The existing events are deliberately limited to safe metadata:

- `generate_username`
- `generate_password`
- `generate_both`
- `copy_username`
- `copy_password`
- `copy_both`
- `username_checked`
- `password_checked`
- `recommendation_clicked`
- `theme_changed`
- `generator_mode_changed`

Do not add `username`, `password`, clipboard text, or the full credential object as an event parameter.

## Secure admin analytics architecture

A protected analytics dashboard cannot safely be implemented as a static page. The production setup should be:

```text
Authenticated admin browser
        |
        v
Your server-side /api/admin/analytics/* endpoints
        |
        v
Google Analytics Data API
```

Required server-side behavior:

1. Authenticate the administrator with a real provider or secure session.
2. Authorize an `admin` role before every analytics request.
3. Keep service-account keys, OAuth secrets, refresh tokens, and `GA_PROPERTY_ID` server-side.
4. Validate date ranges and supported dimensions on the server.
5. Cache GA responses briefly and rate-limit refreshes.
6. Return aggregated data only. Do not accept or log credential values.
7. Add `X-Robots-Tag: noindex, nofollow` to admin responses and keep `/admin` in `robots.txt`.

Suggested endpoints:

```text
GET /api/admin/analytics/overview
GET /api/admin/analytics/traffic
GET /api/admin/analytics/geography
GET /api/admin/analytics/devices
GET /api/admin/analytics/browsers
GET /api/admin/analytics/pages
GET /api/admin/analytics/events
```

`.env.example` lists the names that belong in the deployment secret manager. The public site does not need any of the private Google credentials to generate usernames or passwords.

## SEO deployment note

The production SEO URLs are configured for `https://makemepassword.com/` in `index.html`, `robots.txt`, and `sitemap.xml`. Update them if the final top-level domain differs. Add public route pages such as `/username-generator` and `/password-generator` only when they contain useful, distinct content; do not create thin duplicate SEO pages.
