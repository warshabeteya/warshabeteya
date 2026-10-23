# Warsha Beteya — bilingual website replacement

This is the complete, ready-to-upload GitHub Pages website. Arabic remains at the existing URL; English is at `en/`. No build step, Node server, account or paid service is required to upload and use the static website.

## Upload to GitHub (the normal path)

1. Keep a backup of your current repository or commit before replacing files.
2. Unzip this package. Open the `warshabeteya` folder.
3. Upload **the contents of that folder** into the root of your existing `warshabeteya` repository. Do not create another nested `warshabeteya/warshabeteya` folder.
4. Replace matching files and include the new `en`, `demos/thumbs`, `fonts`, `tools`, `tests`, and `server` folders, plus all root files.
5. Commit. Keep your existing GitHub Pages source/branch settings.
6. Check `https://warshabeteya.github.io/warshabeteya/` and `https://warshabeteya.github.io/warshabeteya/en/` after the deployment finishes. Refresh an old tab once so it loads this release.

The old root-level JPEG duplicates can be deleted; the originals used by this release are inside `demos/`. Leaving old duplicates in the repository does not cause extra page downloads.

## What changed

- Full Arabic and English calculator, inquiry, policies, errors, ratings and WhatsApp messages; reciprocal SEO language links.
- Cleaning has no diagnostic fee. Standalone fault diagnosis is paid in full at intake. All other selected services retain 50% at intake; mixed orders combine these rules per device. Parts remain separate.
- Ordinary software setup and boot recovery explicitly ask whether modification is involved. Standard work does not require modification consent. “Not sure” does not grant modification permission.
- Service compatibility, duplicate-service and bundle protections are preserved.
- Original gallery JPEGs are unchanged. Small WebP thumbnails load in the grid; clicking loads the original in the photo dialog. The download link saves the original, subject to browser download behavior.
- Cairo is self-hosted with its font licence; no Google Fonts connection is needed.
- Mobile text, service-picker spacing, language navigation, focus offsets and input boundaries are improved. CSS is served as a single compact stylesheet.
- Improved accessible errors, quieter price announcements, explicit WhatsApp handoff, long-message copy fallback, and safe text rendering.
- Optional promotions and optional server validation are separate modules. Neither is required for the normal GitHub Pages flow.
- The existing analytics measurement is retained; the privacy disclosure now describes it.

## Promotion switches — no rebuild needed

See `PROMOTIONS.md`. Set `promotionsEnabled: true` in `site-config.js` to connect the campaign module. Set it to `false` to disconnect all campaigns. Edit bilingual campaigns in `campaigns.js`; each has its own `active` switch and inclusive Cairo start/end dates. Expired campaigns disappear automatically. Upload both configuration files when changing them. Existing open tabs need a refresh to receive file edits; date rollover is checked automatically while a tab is open.

There are **no active discounts in this release**. The inactive sample is an example, not a new business offer.

## Genuine server validation — separate deployment required

Uploading server code to GitHub Pages does not execute it. `server/README.md` explains how to deploy the included dependency-free Node service on a separate HTTPS host, then connect `validationEndpoint` in `site-config.js`.

Until connected, the website clearly presents a browser estimate and the usual WhatsApp confirmation. When connected, the server validates device/service choices and consent, recomputes prices, and adds a signed estimate verification link. It does not store orders, process payments, verify phone ownership, or confirm bookings. If a connected service is unavailable, the page preserves the form and asks the visitor to retry or contact WhatsApp; it never pretends validation succeeded.

## Editing and rebuilding later

For ordinary campaign changes, no build is required. For changes to Arabic page copy, service prices or JavaScript:

1. Use Node.js 24 or a compatible modern Node version.
2. Run `npm install` in this folder.
3. Edit the **root** HTML/JS/CSS source. Keep service IDs unchanged unless updating the catalogue deliberately.
4. Update translations in `tools/en.json` when changing visible Arabic wording.
5. Run `npm run build` and `npm test`.
6. Upload the updated root files, `site.css`, and generated `en/` files. If using the optional server, deploy the updated catalogue/campaigns there too.

English files are generated from the same source, with all price numbers and stable selection IDs preserved. The build fails if a new Arabic UI string has no English translation. Do not hand-edit generated `en/` files; rebuilding would overwrite that change.

`site.css` combines `fonts.css`, `style.css`, `inquiry.css`, `journey.css` and `clarity.css` in that order. Keep those source files so future edits remain straightforward. The existing visual layers are retained intentionally to preserve the design; only the combined file is downloaded by visitors.

## Analytics

`analyticsEnabled` defaults to `true`, retaining your existing measurement ID in `data.js`. The script is asynchronous and is not loaded on localhost. Set this option to `false` to disable analytics. The privacy disclosure describes analytics and possible cookies. Form field contents are not passed to analytics events. If changing analytics behavior, keep the disclosure in both languages accurate.

## Verification included

See `TEST-REPORT.md` for automated checks and remaining real-device testing. No changes have been published to your live GitHub site by this package.
