# Merged release verification — 31 October 2026

30 automated tests passed; 0 failures (Node test runner).

Coverage: pricing, inspection/cleaning and mixed-order payments, modification consent, compatibility, duplicate and bundle exclusion, saved choices, promotions and expiry, bilingual catalogue/price parity, phone normalization, optional validation server, and Arabic/English DOM initialization.

New regression checks verify the four outer CSS files are byte-for-byte unchanged, both pages retain the original Google Fonts Cairo link, all eight gallery images use lazy WebP thumbnails, no full-size image src exists before clicking, and the viewer/download link uses the original after clicking. Both languages initialize the standalone inspection flow successfully.

Browser verification: Arabic page loads, gallery images use thumbnail paths, clicking the first photo loads its 3024-pixel-wide original, language switch opens the English page, PS4 selection works, and standalone inspection shows 150 EGP at intake and 0 EGP on return. Desktop appearance was inspected in the browser. No WhatsApp message was sent and no booking was created.

The original gallery JPEGs and brand images are retained. Only English direction corrections are added; existing CSS files are unchanged.

Limits: physical mobile Safari/Android, screen readers and production network behaviour were not tested in this merge. Optional server code passes local automated tests but has not been deployed. The live GitHub website has not been modified.
