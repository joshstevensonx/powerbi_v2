# Daily Sales v3 build scripts

All of these run in the browser console of a signed-in app.powerbi.com tab. Claude in Chrome runs them with `javascript_tool`.

- Token: `window.powerBIAccessToken`.
- APIs: the Fabric REST API (`/v1/workspaces/{W}/reports/{R}/getDefinition|updateDefinition`, PBIR format; long-running operations are followed via the Location header; "OperationHasNoResult" means success) and the Power BI REST API (`datasets/{id}/executeQueries`, `reports/{id}/Clone`).
- Output: JS return values are cut off at about 1,000 characters. Write long output with `window.__show(text)`, which puts it in an `<article id="__dump">` overlay, read it with get_page_text, then remove the overlay.
- Re-run `boot.js` after every page navigation, because globals are lost.

| Script | Purpose |
|---|---|
| boot.js | Helpers: `__W`, `__R` (set it to the target report!), `__dec`/`__enc` (base64 UTF-8), `__H`, `__lro`, `__getDef`, `__qq` (DAX), `__show`, `__ensureDef`. |
| redesign2.js | Full redesign: reads live (d0210659…) and builds the toolbar, drawer, Open/Close bookmarks per page, KPI band, noise cuts and drawer measures. It's the source of truth for the redesign build (47b9663c…). Later patches (KPI sizes, TT · Website traffic tooltip, Done button, z-fix) were done ad hoc. See handover §6.6. |
| zfix.js | Raises Close/Done/✕ visuals above the hidden slicers (z ≥ 100,010). Needs `window.__parts` from a getDefinition. |
| build.js, param.js, bing_cols.js | Deep dive pages, Breakdown field parameter, Bing Ads calc columns. Already live; kept for reference. |

IDs: workspace 78cf89a0-f94a-4399-924d-ad3088c8e605 · model 3647ff2a-d50e-4cfb-bf02-bed980609485 · live v3.0 d0210659-85fd-4d40-93c4-03d8683c492f · redesign build 47b9663c-4c3e-4039-84ab-f04d71d1570d.

Never send invalid visual properties (e.g. `fillCustom`), because a failed import can corrupt the report. Never push onto live without Josh's approval and a fresh backup clone.
