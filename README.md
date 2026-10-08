# Novi Docs — Chicago landing page

Single-page, paid-traffic landing page for Novi Docs (full-arch dental implants, Chicago). Static HTML + one Vercel serverless function.

| File | Purpose |
| --- | --- |
| `index.html` | The page (inline CSS/JS, no build step) |
| `logo.svg`, `logo-white.svg`, `favicon.svg` | Brand marks (wordmark is outlined paths, no font dependency) |
| `attribution.js` | Captures UTMs / click IDs (first + last touch, 90 days) → sent with each lead |
| `api/lead.js` | `POST /api/lead` — validates and forwards leads to `GHL_WEBHOOK_URL` |

## Before going live
- Set the `GHL_WEBHOOK_URL` env var in Vercel (until then leads are accepted but not forwarded).
- Set `window.ND_GTM_ID` in `index.html` to the Novi Docs GTM container.
- Replace the phone number (`8554589911` / `(855) 458-9911`) once the new number is ready.
- Add the Chicago street address (search `STREET ADDRESS`) and update the legal links / canonical URL.

## Ad headline matching
Append `?hl=dentures|missing|second-opinion|financing` to ad URLs (or let it infer from `utm_campaign`/`utm_term`/`utm_content`).

## Tracking events (dataLayer)
`lead_form_start`, `lead_form_step`, `lead_form_submit` (with `event_id` for pixel/CAPI dedupe), `phone_click`, `cta_click`.
