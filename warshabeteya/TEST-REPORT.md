# Release verification — 23 October 2026

## Automated logic/server checks

27 passing tests, 0 failures using Node's test runner (`npm test`). Coverage includes the original customer-flow cases, all priced main services, English/Arabic catalogue parity, Egyptian phone normalization, cleaning versus diagnostic payments, mixed orders, compatibility and duplicate/bundle protection, modification consent classification, draft privacy, promotion validity/expiry, best-offer selection, and the independent validation server.

Server checks cover authoritative price recomputation despite forged client totals, signed verification and signature tampering, incompatible services, missing modification consent, invalid phones, disallowed origins, unsupported content types, oversized JSON bodies, and Arabic/English message output.

## Browser checks

Headless Chromium, using local files over HTTP and the self-hosted Cairo font:

- Arabic and English at 360, 375, 390, 414, 430, 1024 and 1440 CSS pixels.
- Initial page, open main-service picker, checkout and prepared message.
- No page-level horizontal overflow in those tested states and widths.
- Successful name/phone/consent entry and message preview at every tested width.
- Longer flows at 390 px: ordinary setup, explicit modification, missing consent, invalid phone, Linux distribution/mode/backup/custom notes, multiple devices, mixed payment schedule, delete/undo, inquiry “another issue” validation and preview invalidation.
- Optional campaigns enabled through configuration; eligible discount and customer opt-out both tested.
- Gallery network checks: no original JPEG request from the thumbnail grid; the selected full-resolution JPEG is fetched on click. Dialog Escape/focus return and original-download link checked.
- Real local server connection from both languages: verified message produced; a simulated server outage leaves the form intact and does not show a stale success message.
- Automated axe checks of checkout/message and expanded inquiry/gallery states: no reported WCAG 2 A/AA, WCAG 2.1 AA or WCAG 2.2 AA violations in those tested states.
- Mobile Arabic and English screenshots visually reviewed for header spacing, typography and message layout. A header collision found during development was corrected before delivery.

## Asset checks

- All eight original gallery JPEGs are byte-for-byte unchanged from the uploaded archive.
- The thumbnail grid uses separate 640-pixel maximum-dimension WebP images; originals are not replaced or recompressed.
- Cairo font files are locally hosted, with the OFL licence included.
- English compilation checks for missing translations and preserves stable service IDs and prices.

## Limits

These checks are not a blanket accessibility certification or a guarantee for every browser/device combination. Physical iPhone Safari, Android Chrome, screen readers, real mobile keyboards, production network performance and the live deployment should still receive a short smoke test after upload. No external WhatsApp message was sent and no booking was created. The optional validation server has been tested locally but has not been deployed to a hosting account.
