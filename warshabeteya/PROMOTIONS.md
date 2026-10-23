# Seasonal promotions

## Turn everything on or off

In `site-config.js`:

```js
promotionsEnabled: false // disconnected: no offer banners or discounts
promotionsEnabled: true  // connected: only valid, active, in-date campaigns appear
```

Do not paste both lines. Change the one existing setting. Upload this file after editing it.

## Create a campaign

Edit the array in `campaigns.js`. Keep both Arabic and English customer copy. The included sample is **inactive** and its 10% value is illustrative only. Choose your actual commercial terms before activating it.

Fields:

| Field | Meaning |
|---|---|
| `id` | Unique stable code using simple English letters/dashes |
| `active` | `true` to enable this campaign; `false` to disable it |
| `startDate` / `endDate` | Inclusive `YYYY-MM-DD` dates in Africa/Cairo; `''` means unrestricted |
| `title`, `description`, `note` | `{ar:'...', en:'...'}` bilingual customer copy |
| `type` | `percent`, `bundle`, or `second-controller` |
| `services` | Stable service IDs from `data.js`, not translated display names |
| `device` | Optional device restriction; required for bundles |
| `percentOff` | Percentage greater than 0 and at most 100 for percentage/controller offers |
| `price` | Labour price for a bundle; nonnegative EGP amount |
| `devices` | Controller IDs eligible for a `second-controller` offer |

For a fixed-price bundle, use `type:'bundle'`, one valid `device`, compatible service IDs and a `price`. For a second-controller offer, use `type:'second-controller'`, `devices:['ds2','ds3','ds4']`, repair-service IDs and `percentOff`. Do not include `inspect` in any promotion. Do not include Linux/conditional add-ons in bundles; their pricing depends on further choices.

The best **single** applicable discount is used for the whole request. It does not stack. A percentage offer applies to its listed labour lines on one eligible device, selected to give the best single saving. For the second-controller offer, the second eligible controller in the request receives the configured discount on eligible labour lines. Customers can opt out in the summary. Prices never include parts.

## Safe seasonal workflow

1. Duplicate an inactive campaign object and give it a new ID.
2. Set the actual service IDs, price/percentage, dates and bilingual wording.
3. Set that campaign's `active` to `true` and the master switch to `true`.
4. Preview both languages. Select an eligible service and an ineligible service; check each total and payment schedule.
5. Upload `campaigns.js` and `site-config.js` together. If server validation is connected, deploy the same files to the server too.
6. To end early, set `active:false`. To hide every offer, set `promotionsEnabled:false`. To end on schedule, let `endDate` expire.

No HTML changes or rebuild are required for campaign edits. A page refresh is needed to receive configuration edits. An already open page checks Cairo date rollover every minute and on returning to the tab.

Missing or malformed campaigns are ignored by the adapter so booking remains available. The master setting is intentionally off in the delivered package.
