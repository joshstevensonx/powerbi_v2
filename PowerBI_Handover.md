# 1-grid Daily Sales Power BI — Handover for a new AI project

> **Purpose:** give a new AI assistant everything it needs to continue the 1-grid Daily Sales Power BI work without re-asking. Read this first, then the supporting files listed in §10.
> **Owner:** Josh Stevenson (Nexora Web Agency), building the report for 1-grid.
> **State as of:** 18 Oct 2026, ~14:50 UTC; offline session notes added the same day (§11).

---

## 1. Read this first: open items

| # | Item | Status | What to do |
|---|---|---|---|
| 1 | **Website (GA) page + grouped filters** are built in the copy *Daily sales (v3.0) - new layout preview* | ❌ **Josh said no (18 Oct)** to copying them onto the live *Daily sales (v3.0)* report | Leave the live report as is. The preview copy stays for reference; don't delete it unless Josh asks. Details in §6.3. |
| 1b | **New Website page + 3 deep-dive pages, grouped filters, tooltip fix, Breakdown selector** | ✅ **Approved by Josh and LIVE (18 Oct ~11:50 UTC)** | The build copy's definition was pushed onto the live *Daily sales (v3.0)* (same ID/URL). Restore point: *Daily sales (v3.0) - backup before deep dive 2026-10-18* (ID 6f2a2242-3a79-4a10-a961-6777576aea31). Details §6.4–6.5. |
| 1c | **Model changed 18 Oct ~11:20 UTC** (Bing Ads, Breakdown parameter) — see §6.5 | ✅ Done, live | Restore point: semantic model *Daily sales (Model) v2.0 - definition backup 2026-10-18* (metadata only). |
| 1d | **Full redesign of all 9 pages** (slide-out filter drawer, KPI band with deltas, low-noise charts, new website tooltip) in the copy *Daily sales (v3.0) - redesign build* (ID 47b9663c-4c3e-4039-84ab-f04d71d1570d) | ⏳ **Waiting for Josh's review**. Not on live. ❗ **Josh reports the filter drawer does not close** (18 Oct ~14:40 UTC). 🛠 **Fix script ready, not yet run:** `scripts/drawerfix.js` (§11.1) | Run drawerfix.js on one page, test with real mouse clicks, then all 9 pages, then *Reset to default* (§11.1). Then Josh checks the build. Promote onto live only when he approves, with `scripts/promote_redesign.js` (backs up live first; §11.2). Details §6.6. |
| 2 | **Web edits vs the .pbix** | ⚠️ Risk | Everything in §6 was edited directly in the Power BI service. **Re-publishing the model or report from a Desktop .pbix will overwrite these edits.** Download a fresh copy from the service before any Desktop work. |
| 3 | Extra report copies in the workspace | Open, proposal in §11.3 | *Daily sales (v3.0) - backup 2026-10-18*, *- backup before deep dive 2026-10-18* (restore points), *- new layout preview*, *- deep dive build* (now the same as live), *- redesign build*. Josh hasn't said whether to delete any. Keep the backups until he does. Not re-listed via the API on 18 Oct (no Chrome). |
| 4 | BigQuery refresh cost | Drafted, not deployed (§11.4) | `GA_INVOICES` and `Sessions` rescan every GA4 event since 2026-01-01 on each refresh. Draft in `daily-sales-ga4/incremental/`: partitioned tables + idempotent daily load (last 3 days) + views with a live tail, then a SQL-text-only Power Query change. Needs Josh's go-ahead, and the original Sessions SQL to finish `tvf_sessions`. |
| 5 | Model clean-up (16 unused legacy tables, auto date/time) | Proposed 9 Oct, refined 18 Oct (§11.5), not done | List in §8, removal list in §11.5. Josh asked to keep `Calculator` and `Order recurring amount`. Check lineage and v3.0 visual usage first (two reports share the model). |
| 6 | Attribution rule | Design choice | GA attribution = user's **first session on the day they viewed the invoice**, not the session of the view. Kept on purpose; change only if Josh asks. |

---

## 2. Business and environment

| Item | Value |
|---|---|
| Business | **1-grid**, South African web hosting provider. Data = WHMCS billing (orders, invoices, services, domains, clients). |
| Currency / VAT | Rand (R). WHMCS amounts include 15% VAT. Report measures are **excl. VAT** via `vat_factor` (= subtotal ÷ total). |
| Fiscal year | Ends June. Model culture en-US, source culture en-ZA. Time zone SAST (UTC+2). |
| Workspace | **BigQuery Reports** (Fabric / Power BI service), workspace ID `78cf89a0-f94a-4399-924d-ad3088c8e605`. (`70269500-c631-4ba1-a9f9-9fdf7461408f` is the 1-grid **tenant** ID, not the workspace.) Sign in as **data.analyst@1-grid.com**. |
| Semantic model | **Daily sales (Model) v2.0**, ID `3647ff2a-d50e-4cfb-bf02-bed980609485`. Import mode. |
| Reports on the model | **Daily sales (v3.0)** = the current live redesign (main focus), ID `d0210659-85fd-4d40-93c4-03d8683c492f`. **Daily Sales (v2.0)** = older report, ID `7e523292-8e4d-4bf6-ae0b-fe57e7bb1a90`. Both are live-connected, so model changes affect both. |
| Sources | WHMCS MySQL `whmcsliv_live` via **Dremio 21.2** (`dl-coordinator01.1-grid.com:31010`) through on-prem gateway **BI Gateway Office** (server 1G-WPDN-POWERBI). One Excel on a personal OneDrive (`client_groups`). Since 18 Oct 2026: **Google BigQuery** GA4 export `grid-bq-project.analytics_372327256.events_*`. |
| How work gets done | Mostly in the **Power BI service in Josh's Chrome** (edit report, *Open data model* for DAX/relationships, BigQuery console to test SQL). No Desktop file is used day to day. Josh's local folder: `~/Desktop/powerbi` (has `DailySales_docs/`, incl. a 7 Oct TMDL backup `model_backup_2026-10-07_before_cleanup.tmdl`). |

**Audiences:** executives (is revenue on track?), sales & marketing (which products, customers, channels drive revenue?), finance (unpaid / cancelled / pending?), BI team (does it reconcile to WHMCS?).

---

## 3. Core data model

```
Calendar[Date (format)] ──1:*──> orders_invoices_tbl[order_date]
orders_invoices_tbl[order_id] ──1:*──> revenue_orders_tbl[order_id]
Clients[client_id] ──1:*──> revenue_orders_tbl[client_id]
client_groups[id] <──both──> Clients[groupid]
Combined Revenue ──> feeds revenue_orders_tbl (lookups only)
Product Guide = built FROM revenue_orders_tbl (no relationship)
```

| Table | Grain | Use |
|---|---|---|
| `revenue_orders_tbl` (DAX calc table, main fact) | One row per service on an order, plus one "Not in Combined Revenue" row per order with no service rows | **All product / customer / channel visuals.** `invoice_total_alloc` splits the invoice across products so rows sum to the invoice. |
| `orders_invoices_tbl` (DAX calc table) | One row per WHMCS order, with its invoice | Order-level totals and reconciliation. Covers orders from about Jul 2025 only. |
| `Combined Revenue` (Dremio) | Service/domain line since 2021 | Source of revenue_orders_tbl; legacy. |
| `Calendar` (M) | Date, 2019-01-01 → end of current year | Relate on **`Date (format)`**, not `Date` (`Date` drives legacy tables; using it creates ambiguous paths). |
| `Clients`, `client_groups`, `How Did You Hear About Us` | Client attributes | Already looked up into revenue_orders_tbl. |
| `Product Guide` (DAX) | Sub-category glossary | Guide drill-through page. |
| `GA_INVOICES`, `Sessions` (BigQuery) | See §5 | Website / Google Ads analysis. |

**Rules that keep numbers right**
- Filters flow **into** `revenue_orders_tbl` and never back out. Any visual that must respond to product/customer/GA slicers must use a `revenue_orders_tbl` measure.
- `orders_invoices_tbl` measures (`Paid Invoice Revenue`, `Paid Orders`) ignore product/customer slicers.
- The *(Products)* measures remove the Calendar filter and re-apply the dates to `revenue_orders_tbl[Revenue Date]` (TREATAS), so **paid revenue lands on the paid date**, not the order date.
- Revenue = paid invoice value excl. VAT. Orders with R0 invoices are excluded (`invoice_total > 0`).
- Product order counts double-count multi-product orders, so category order counts sum to more than the KPI.

**Key measures** (`revenue_orders_tbl` unless noted): `Paid Revenue (Products)`, `Paid Orders (Products)`, `Unpaid Revenue (Products)`, `Unpaid Orders (Products)`, `Unpaid / Cancelled Invoice Total`, `Paid Invoice Total`, `RO Invoice Total`; on `orders_invoices_tbl`: `Paid Invoice Revenue`, `Paid Orders`. Full DAX is in the v2 documentation §7.

**Product hierarchy:** Category › Sub Category › Product Name, calculated in revenue_orders_tbl from `service_group` / `service_type` / `product_type` (first match wins). Categories: Domains, Application Hosting, Infrastructure Hosting, Web Services, Security & Backup, Business Services (+ "Not in Combined Revenue"). To add a product, edit **both** Category and Sub Category SWITCHes in the same position, then Product Guide.

**Customer attributes:** `type_of_customer` (New if sign-up date = order date), `customer_tenure_group` ("Customer Age" = account age, not person's age), `signup_agent` → Sales Channel (App if "App Sale", else Website), Client Group, `heard_about_us` ("Discovery method"), Domain Region (Local = .co.za, .net.za, .org.za, .web.za, .capetown, .durban, .joburg, .africa).

---

## 4. Reconciliation facts already established

- **January 2026 vs Josh's WHMCS CSV (checked 7 Oct):** the CSV's 907 paid orders / R233,508.90 mixes order-date and paid-date. Report paid-date view = 866 orders, R227,050.53 (3 orders missing because they were placed before the order data starts). Order-date paid count = 883 ✅. Unpaid 86 / R14,631.59 ✅ and Cancelled 109 / R148,741.26 ✅ match exactly. Offered (not built): a "Paid (by order date)" figure.
- **Design brief benchmark:** 1–29 Sep 2026 = 588 paid orders, R143,924.45 (WHMCS). Not re-run since the excl.-VAT change.
- The team's old Excel tracker (`Sales_Report.xlsx`) reports revenue **excl. VAT on the day payment was made**, no unpaid sales. The report follows the same rule.

---

## 5. GA4 tables (added 18 Oct 2026)

Both are native BigQuery SQL over `grid-bq-project.analytics_372327256.events_*` from 2026-01-01 plus intraday tables. They replace the retired Universal Analytics tables (`Daily sessions - GA` etc., now dead). **GA4 data actually starts 18 Jun 2026.** GA4 only sees consenting browsers, so counts are lower bounds.

### 5.1 `Sessions`
- **Grain:** one row per `upi` (GA4 user_pseudo_id) per `date` = that user's **first session of the day**. `COUNTROWS` = user-days, not sessions.
- Columns: `upi`, `uid` (GA user_id, assumed WHMCS client ID, **not verified**), `date`, `sid`, `session_start`, `browser`, `platform`, `device_type`, `device_os`, `country`, `city`, `traffic_category` (default channel group), `utm_campaign`, `traffic_source`, `traffic_medium`, `gads_campaign` (`'-'` when not Google Ads).
- SQL reviewed and judged sound. The SQL Josh shared is in the GA thread and the v2 doc §5.10.

### 5.2 `GA_INVOICES` (model name; called `ga_invoice` in docs)
- **Grain:** one row per WHMCS invoice ID first viewed on `1-grid.com/client/viewinvoice.php?id=…`, at its earliest view, with the Google Ads campaign of that user's first session that day.
- Columns: `invoice_id` (Int64, matches `tblinvoices.id`), `invoice_date` (first **view** date, not invoice/paid date), `upi`, `campaign_name`, `is_gads`.
- The model now runs the **fixed SQL** saved at `/mnt/project-files/daily-sales-ga4/ga_invoice_fixed.sql`. Josh's original had: angle-bracket URL literals (matched nothing), REPLACE-based ID parsing (trailing params broke matching), user × invoice duplicates, campaign-grouped "first session" logic that under-counted Ads, and an inner join that kept only Ads invoices.
- Verified in BigQuery 18 Oct: ~27,315 invoices, one row each; ~1,448 from Google Ads.

---

## 6. What was changed live on 18 Oct 2026 (Power BI service, via Chrome)

All approved by Josh in the "Working in Chrome" thread. **None of this exists in any .pbix.**

### 6.1 Model: *Daily sales (Model) v2.0* — LIVE
1. `GA_INVOICES` switched to the fixed SQL (`invoice_id` whole number, `is_gads` flag).
2. Relationships:
   - `Sessions[date]` → `Calendar[Date (format)]` (active).
   - `GA_INVOICES` ↔ `Sessions` on a **hidden upi + date key** column in both tables (active). 15,810 of 15,815 upi/date pairs match.
   - `GA_INVOICES[invoice_date]` → `Calendar[Date (format)]` exists but is **inactive** (Power BI won't allow two paths). Date slicers reach GA_INVOICES through Sessions; only the 5 unmatched pairs lose date filtering.
   - **No** direct invoice_id relationship to orders (would give Calendar two paths to orders).
3. Lookup (calculated) columns on **both** `orders_invoices_tbl` and `revenue_orders_tbl`, matched by invoice_id:
   - `GA Source`: Google Ads / Bing Ads / Other / Not seen in GA (Bing Ads added 18 Oct, §6.5)
   - `gads_campaign`: Google Ads campaign, or "Bing – <GA4 utm_campaign>" for Bing paid visits, or "No ad campaign" (was "Not Google Ads" before 18 Oct)
   - Session columns from that invoice's user's first session that day: **Session Browser, Platform, Device, Channel, Source, Medium**
4. Value clean-up in those columns: blanks → "Unknown"; no GA match (incl. revenue rows with no linked order) → "Not seen in GA"; readable labels (Device: Desktop/Mobile/Tablet; Platform: Web/Android app/iOS app; Source: Google, Bing, ChatGPT, Gmail, "(not set)" → "Direct / none"; Medium: "cpc" → "Paid search (CPC)", Organic, Referral, "None (direct)").
5. A small **hidden table that stamps the refresh time** on every model refresh (SAST, UTC+2), used in the report header.
6. Model refreshed and checked with DAX: of 4,468 orders since 18 Jun, 1,912 matched a GA invoice view; 108 Google Ads (Brand Search 57). Unmatched orders usually mean the customer never opened the invoice page. Orders before 18 Jun all show "Not seen in GA".

Measure templates for GA (from v2 doc §5.10): `GA Users (Day) = COUNTROWS(sessions)`, `Invoice Views = COUNTROWS(ga_invoice)`, `Invoice View Rate = DIVIDE([Invoice Views],[GA Users (Day)])`, `Paid Revenue (Google Ads) = CALCULATE([Paid Revenue (Products)], revenue_orders_tbl[GA Source]="Google Ads")`. Note: GA measures land on view/session date, revenue on paid date.

### 6.2 Report: *Daily sales (v3.0)* — LIVE
Pages: **Website, Daily Sales, Overview, Products, Customers & Channels, Collections**.
- **Slicers:** GA source, Campaign, plus six session slicers (Channel, Source, Medium, Device, Browser, Platform) on all six pages, synced across pages. They use the orders/revenue lookup columns, so they filter revenue and order visuals.
- **Layout:** page height unchanged at **1148**; everything right of the filter panel shifted 80 px right, pages now **1580 wide**; filter panel 80 px wider, slicers in two columns, Payment method full width; header box taller.
- **Header styling:** title 18 → 24 pt, subtitle 10 → 12 pt; date card now reads e.g. *17 Oct 2026 – 18 Oct 2026 · Data to 18 Oct 2026 · Updated 18 Oct 2026, 10:10* (card width 790, 12 pt); logo 170 × 60, right-aligned.
- **Filter panel styling:** "Filters" label 11 → 13 pt, wider Clear all button, slicer labels 9 → 10 pt, values 10 → 11 pt. KPI cards and charts unchanged.
- Copies saved: *Daily sales (v3.0) - backup 2026-10-18* (pre-change restore point).

### 6.3 Built in the preview copy only — ❌ NOT APPROVED (Josh said no, 18 Oct)
In *Daily sales (v3.0) - new layout preview*. Josh's last request was "generate a page for new data", "logically group filters", then "add Product/order". The final yes/no ask (08:55 UTC) has no answer yet.

**Filters grouped (all six pages)**, labelled sections under the date range:
- **Product:** Category, Sub category, Product, Domain, Domain region
- **Customer:** Customer type, Customer age, Sales channel, Client group, Country, Province, Discovery method
- **Order:** Service status, Billing cycle, Payment method
- **Website (GA):** GA source, Campaign, Channel, Source, Medium, Device, Browser, Platform

**New Website page** (would replace the live Website page, which is currently a duplicate of Daily Sales):
- Same header/filter style; GA filters plus Ads campaign and Country; Product/Customer/Order filters too, synced.
- KPIs: Users per day, Unique visitors, Google Ads users, Ads share, Invoice views, Invoice view rate, **Paid orders (web)**, **Paid revenue (web)** (paid orders whose invoice was viewed after a website visit; respond to GA and product/customer/order filters).
- Visuals: users per day (bars) + invoice views (line); device split; channel table (users, invoice views, view rate, paid orders, paid revenue); source/medium table with view rate; Google Ads campaign table with paid orders and revenue.
- Sample (17–18 Oct): 1,046 users/day, 86 invoice views, 8.2% view rate; 9 web paid orders, R 889.

**If Josh later changes his mind:** copy the grouped filter panel to all live pages and replace the live Website page; re-check slicer sync and the header on each page.

### 6.4 Deep dive build — ✅ LIVE since 18 Oct (approved by Josh)
Report *Daily sales (v3.0) - deep dive build*, ID `1d54745e-c637-46ca-bd0e-6883f89d25d8`, cloned from the live v3.0 on 18 Oct. Built through the Fabric REST API (getDefinition / updateDefinition, PBIR) from Chrome, no model changes. Josh chose: balanced Website page; deep dives as three pages that are also drill-through targets; row-level tables.

- **New measures are report-level** (`reportExtensions.json`, display folders *Website* and *Deep dive*), so they exist only in this report, not the shared model. Report-measure references to other report measures need `"schema": "extension"`; tableEx column projections must not carry `"active": true` or measure columns are dropped.
- **Website page (rebuilt):** cards Visits, Invoice views, View rate, Paid orders (web), Paid revenue (web), Web share; combo of visits vs web paid orders by day; stacked bar of web invoice value (paid / unpaid / cancelled) by channel; channel table (visits, invoice views, view rate, paid orders, paid revenue, unpaid orders, order rate); Google Ads campaign table.
- **Traffic bridge:** `Web Visits` / `Web Unique Visitors` / `Web Invoice Views` wrap the model's `GA Users` / `GA Visitors` / `Invoice Views` so the revenue_orders_tbl GA slicers (Channel, Device, Browser, Platform, Campaign, GA source) also filter Sessions. Source and Medium labels differ between the two sides, so those two slicers filter orders only. `… by Visit Channel/Campaign/Device` measures TREATAS the Sessions row onto revenue_orders_tbl.
- **Deep Dive – Orders & Invoices** (drill-through on `revenue_orders_tbl[order_id]`): order-date basis; cards Orders placed, Invoiced value, Paid orders, Unpaid, Cancelled, Avg days to pay; bars by invoice status, payment method, category; row-level order table (order, dates, statuses, client, company, customer type, channel, GA source, products, value excl. VAT).
- **Deep Dive – Clients** (drill-through on `revenue_orders_tbl[client_id]`): cards Clients ordering, Paying clients, New paying clients, Revenue per paying client, Clients with open invoices, Unpaid; bars by client group, account age, province; client table + orders table for the selected client. Shows company name only (no emails/phones).
- **Deep Dive – Website** (drill-through on `revenue_orders_tbl[Session Channel]`): cards Visits, Unique visitors, Invoice views, Paid orders (web), Unpaid (web), Visit → paid order; bars by device and browser; pie of paid revenue by GA source; source/medium traffic table; web-linked order table with session details.
- **Grouped filter panel** (added 18 Oct, all 9 visible pages): the preview copy's panel was copied in under the date range, with section labels **Product** (Category, Sub category, Product, Domain, Domain region), **Customer** (Customer type, Customer age, Sales channel, Client group, Country, Province, Discovery method), **Order** (Service status, Billing cycle, Payment method) and **Website (GA)** (GA source, Campaign, Channel, Source, Medium, Device, Browser, Platform). All slicers are on revenue_orders_tbl and synced across pages; z-order raised above the panel background (36000+). Tested: Channel = Paid Search carries over to the deep dives and filters traffic and orders.
- `Web Share of Paid Revenue` now removes the GA filters from its denominator, so it stays a share of *all* paid revenue when a GA filter is set.
- **Tooltips fixed (18 Oct):** the 18 Oct header restyle on the live v3.0 also moved the KPI card on all 17 tooltip pages to x 580 / width 790 (mistaken for the header date card), so tooltips showed an empty top half. **The live report still has this bug.** In the build copy each tooltip page now has two 2-value cards (y 4 and y 88, height 82, width 404) and the chart at y 172, height 162; verified by hovering. New canvas tooltips on the build copy: web-orders stacked bar and GA-source pie → *TT · Which marketing sources*; invoice status → *TT · Where is value stuck*; payment method → *TT · Which payment methods collect best*; category → *TT · Which categories earn the revenue*; client group / account age / province → *TT · How long have buyers been with us*. Device/browser charts and tables keep default tooltips.
- Each deep-dive page has a Back button (button + "← Back" label). The page tabs sit after Collections. Slicers are cloned with their sync groups.
- Checked 17–18 Oct: 1,084 visits, 88 invoice views (8.1%), 9 web paid orders, R 889, matching the model's `Web Paid Orders` / `Web Paid Revenue`. Drill-through from the Collections table opens the order on the Orders deep dive.
- Known data quirks seen: province is free text (several "Gauteng" variants); some company names contain HTML entities (e.g. "Arthur039s"); date columns show 00:00:00.

**Promoted 18 Oct:** live v3.0 now has the same definition as the build copy (Fabric updateDefinition onto `d0210659-…`). Tooltip validation on live: all 17 tooltip pages inside 420×340, two 2-value cards each, no overlaps; all 25 tooltip links resolve; every tooltip measure evaluates; hover-tested on Website, Daily Sales and Deep Dive – Clients. Viewers with saved slicer state may need *Reset to default* once.

### 6.5 Bing Ads + Breakdown parameter — 18 Oct, model and report LIVE
Josh asked for a selectable parameter on the Website visuals (Session Source, Session Channel, "GA Search" = GA source) and for GA source to include Bing Ads (source: Microsoft Ads report 1–11 Oct; Bing campaigns BING: Generic - Domains max conv, BING: Generic - Company Registration, BING: Branded - tImp 2ZAR 90%). He chose to change the model and to keep GA4's campaign labels.

**Model (shared, via Fabric updateDefinition/TMDL, ~11:20 UTC; applied between scheduled refreshes, data kept, calc columns recalculated):**
- `orders_invoices_tbl[GA Source]`: Not seen in GA / Google Ads (GA_INVOICES.is_gads) / **Bing Ads** (session traffic_source = bing and medium = cpc) / Other. `revenue_orders_tbl[GA Source]` follows via RELATED. 21 orders moved Other → Bing Ads (all time).
- `orders_invoices_tbl[gads_campaign]` (+ revenue copy): Google campaign, else for Bing paid "Bing – " & utm_campaign (brand, Domains, Hosting; "(organic)/(not set)/(direct)/(referral)" → "not tagged"), else **"No ad campaign"** (renamed from "Not Google Ads").
- `Sessions[Visit Ads Campaign]`: same labels; new `Sessions[Visit GA Source]` (Google Ads / Bing Ads / Other).
- New field-parameter table **Breakdown** (Session source = revenue_orders_tbl[Session Source], Session channel = [Session Channel], GA source = [GA Source]).
- GA4 Bing paid visits since 18 Jun: brand 1,608, Domains 1,023, not tagged 769, Hosting 606. The Company Registration and Dynamic Domains campaigns have no utm_campaign in their final URLs, so they land in "not tagged"; adding utm_campaign to those Bing URLs would split them out.
- Restore point: *Daily sales (Model) v2.0 - definition backup 2026-10-18* (ID 38738a05-3724-4903-a55a-58be88554755), metadata only, never refreshed.

**Build copy report:**
- "Break down by" button slicer (Session source / Session channel / GA source, strict single select, defaults to the first) on the Website page, top right. It drives the stacked bar (web invoice value by status) and the breakdown table (visits, invoice views, view rate, paid orders, paid revenue, unpaid orders, order rate). Campaign table now covers Google and Bing campaigns.
- Traffic bridge (`Web Visits`, `Web Unique Visitors`, `Web Invoice Views`) now maps all eight Website (GA) filters including Source, Medium and GA source (via `Visit GA Source`). Checked: GA source rows add up to total visits.
- PBIR lessons: a field-parameter projection must hold a real column (here revenue_orders_tbl[Session Source]) plus `"fieldParameters":[{"parameterExpr":{Breakdown[Breakdown]},"index":0,"length":1}]` on the role; don't store a default selection filter on the parameter slicer (it was applied as a bogus filter to the Channel slicer and blanked every page until *Reset to default*); don't clone a synced panel slicer to make a new slicer.
- Website deep dive pie: Bing Ads colour #00C18B.

### 6.6 Redesign build — ⏳ awaiting Josh's review (not live)
Josh asked to reformat every page using dashboard design principles (signal-to-noise, custom tooltips), inspired by the mokkup.ai and Coupler.io Power BI template galleries. His choices: build in a **new copy of live**, **keep 1580 × 1148**, **slide-out filter drawer**, **all 9 pages** plus tooltips.

**Report:** *Daily sales (v3.0) - redesign build*, ID `47b9663c-4c3e-4039-84ab-f04d71d1570d`, built from live by script (`redesign2.js`), then patched.

**Layout (every page):**
- Toolbar row at y≈100: **☰ Filters** button (x24, 150×40) and the date slicer (x184, 300×46). The old always-on left panel is gone; content now uses the full width (x' = 24 + (x−336)·1532/1228, y rescaled into 284–1132).
- **Filter drawer:** all panel slicers, headings and Clear all are hidden by default and shown by the bookmark *Open filters – <page>*. The drawer card (shape with shadow, h984) has a ✕ in the top right and a full-width **Done** button at the bottom. Both apply *Close filters – <page>*. Bookmarks use targetVisualNames + applyOnlyToTargetVisuals + suppressData, so they only toggle visibility and never reset filters. All existing slicers and sync groups are kept.
- The Filters button outline turns **amber** when any filter is active (measure `Active Filters Chip Colour`). Report measures added: `Active Filter Count` (ISFILTERED over the 23 slicer columns), `Active Filters Label`, `Active Filters Chip Colour`.
- **KPI band** at y148: value cards (h92 with a delta card under them at y238 h38, h126 without a delta).
- **Noise cut:** chart borders and gridlines off, the combo date axis set to categorical, short one-line question titles.
- Not-null filters on the app/agent, marketing source and services-status charts (no "(Blank)" bars).

**Tooltips:** new page **TT · Website traffic** (Web Visits / Web Unique Visitors, Web Invoice Views / View rate, bar of visits by Visit Channel). It is linked to the Website combo, devices, browsers, ad campaigns table and source/medium table. Also linked: add187 → Daily pivot, 0f6524 → Products matrix, 6a80871 → breakdown table. Hover-checked on the Deep Dive – Website devices chart (923 visits).

**Checked:**
- All 9 pages visually reviewed.
- Drawer opens with the Filters button.
- Done closes it (confirmed with keyboard activation; the URL switched to the close bookmark).
- Ran *Reset to default* afterwards.

**❗ Open bug: the filter drawer doesn't close (Josh, 18 Oct ~14:40 UTC).** The Filters button opens the drawer with a mouse click, but clicking ✕ or Done doesn't close it.
- **Already done:** Close/Done raised to z ≥ 100,010 above the slicers (`zfix.js`). `elementsFromPoint` confirms the Done button is the top element and its tooltip reads "Bookmark. Click here to follow". Keyboard Enter on the selected Done button *does* apply *Close filters – Overview* (the URL changes to bookmarkGuid=3a2cc9e0fe1a72aceba9), so the bookmark itself is correct.
- **Main suspect:** buttons that are `isHidden:true` at load and then shown by a bookmark don't respond to mouse clicks in the service. The Filters button is visible at load and works. The two buttons' JSON otherwise differs only in fill (Done has fill on at 100% transparency; Filters has fill off).
- **Fix ideas, in order:**
  1. **Toggle at the Filters spot:** add a "Close filters" button at the same x/y as the Filters button, `isHidden:false`, with a lower z than the Filters button. The Open bookmark hides the Filters button (exposing Close); the Close bookmark shows it again. Keep the Done and ✕ buttons visible at load too, or drop them.
  2. A native **bookmark navigator** for a per-page group [Open, Close].
  3. As a test, set Done `isHidden:false` on one page and check whether a mouse click then works.
- **Test with real mouse clicks.** Synthetic clicks from Claude in Chrome also failed on Done, so they are a reasonable proxy for this bug.
- **18 Oct (offline session): fix idea 1 is scripted as `scripts/drawerfix.js` but has NOT been run on the service yet** (no Chrome in that session). It removes the ✕ and Done visuals rather than making them visible at load: visible at load they would sit over the KPI band and the content area as transparent click targets. How to run it: §11.1.

**Lessons:**
- An invalid property in a visual (e.g. `fillCustom`, or `backgroundShow` in the wrong object) makes updateDefinition fail **and corrupts the report** (getDefinition → Explore_ExplorationNotFound). The fix was to rebuild from live with the script and push onto the same ID. Keep the build script as the source of truth.
- Hidden panel slicers sit at z ≈ 96–97k, so anything that must be clickable inside the drawer needs a higher z. Close/Done buttons now sit at z ≥ 100,010.
- Synthetic clicks from browser automation don't always fire bookmark buttons; keyboard Enter on the selected button does. Real mouse clicks work.
- Button text doesn't render in this theme: use a textbox label under a transparent button.
- Viewers with saved state may need *Reset to default* once.

**To promote (only after Josh approves):**
1. Clone live to *Daily sales (v3.0) - backup before redesign <date>*.
2. getDefinition from 47b9663c and updateDefinition onto live `d0210659-…`.
3. Hover-test the tooltips, test the drawer and run *Reset to default*.

---

## 7. Design standards (from the design brief and redesign)

- **Theme:** base `CY26SU09` + custom *1-grid Brand*. Colours: cyan #00C1DE (Paid / primary), cool grey #55565A, green #00C18B, tints #7FDFEE #A7A8AB #7FE0C5 #007E91 #00845F, black #231F20, **amber #F2A900 = unpaid/pending**, **red #E5484D = cancelled**. Segoe UI. Page background #F4F6F8, white rounded cards.
- **Page frame:** header bar (title "PAGE | subtitle", date/refresh card, logo) → left filter panel → KPI band → charts. The redesign build (§6.6) replaces the left panel with a toolbar (Filters button + date) and a slide-out drawer.
- Each page answers **one business question** in its title/subtitle. Cut visual noise: hide value axis when data labels are on, one-line titles, no repeated legend titles.
- Josh's preferences seen in this work: **don't redesign or change page height without asking**; adjust width instead; keep every existing filter; ask before overwriting a live report (build in a preview copy first, save a backup); give clean slicer labels with no "(Blank)".

---

## 8. Known issues and backlog

- **Model clean-up candidates** (unused by both reports): Calculator, Combined_rev Summary 2 & 3, Invoice Revenue (improved), Order recurring amount, four UA `* - GA` tables, FY21/FY22 budgets, Customer age grouping, Mapping, Level Of Detail, Max sales previous wk / wk1 (broken: reference a missing `[Total new revenue]`). Keep Summary 2/3 and Invoice Revenue (improved) if Calculator stays. Turn off **Auto date/time** (~59 hidden date tables; may need Desktop). Must keep: revenue_orders_tbl, orders_invoices_tbl, Calendar, Clients, client_groups, Product Guide, Combined Revenue, tblorders, tblinvoices, How Did You Hear About Us, Invoice detail, CI_invoicing_20210201, Service Addons, Addons, tblactivityinvoicecreation, tblcustomfieldsvalues.
- `client_groups` reads an Excel on a personal OneDrive (data_analyst@1-grid.com): single point of failure.
- BigQuery is a cloud source in a gateway-bound model: the gateway must allow cloud sources, or refresh fails.
- `Sessions[uid]` → `Clients` link is unverified.
- orders_invoices_tbl starts ~Jul 2025 (Dremio `tblorders` view); `tblinvoices` filtered to > 2022-01-01 in M.
- Personal/payment columns loaded in `Clients`; should be hidden or removed.
- Revenue Tooltip page (v2.0) uses implicit Sum/Count and overstates revenue.

---

## 9. How to work safely

1. Changes to the **model** affect every report on it (v2.0 and v3.0). Check *Lineage view* first.
2. For report changes, build in a **copy**, save a dated **backup**, and ask Josh before overwriting the live report.
3. After model changes, **refresh** and check numbers with a DAX query before telling Josh it's done.
4. New report visuals should use `revenue_orders_tbl` measures so every slicer applies.
5. New attributes on revenue_orders_tbl: add a LOOKUPVALUE calculated column (or add to both halves of the UNION at the same position).
6. Reconcile against WHMCS with `paid_orders.sql` (orders ⨝ invoices, invoice_total > 0); remember (Products) measures date on paid date, the SQL on order date.

---

## 10. Supporting files to upload with this handover

(18 Oct additions: `scripts/drawerfix.js`, `scripts/promote_redesign.js`, `daily-sales-ga4/incremental/*`. In Josh's `~/Desktop/powerbi` repo, the scripts live in `scripts/`; in the Project they belong under `daily-sales-v3/scripts/`.)

| File | What it is |
|---|---|
| `daily-sales-v3/scripts/*.js` | Browser-console build scripts (run in an app.powerbi.com tab). `boot.js` defines the helpers (`__getDef`, `__lro`, `__qq`, `__show`…; set `window.__R` to the target report). `redesign2.js` = full redesign from live → build parts in `window.__rparts`/push. `zfix.js` = the z-order patch. `build.js`/`param.js`/`bing_cols.js` = deep dive, Breakdown and Bing work (historical, already live). See `daily-sales-v3/scripts/README.md`. |
| `knowledge/daily-sales-v2/Daily_Sales_v2_Documentation.md` | **Full model + report reference** (tables, every column, all DAX, relationships, M, known issues). §5.10 covers the GA tables. The most important companion file. |
| `knowledge/daily-sales-v2/powerbi_report_design_instructions.md` | Design brief: audiences, page specs, measure rules, design and validation standards. |
| `daily-sales-ga4/ga_invoice_fixed.sql` | The GA_INVOICES SQL now live in the model. |
| `knowledge/daily-sales-v2/handoff_session1_2_text.txt` | 2 Oct handoff from the first redesign sessions (v2.0 report; layout how-tos for the Power BI service). Mostly historical. |
| `knowledge/daily-sales-v2/current_report_visuals.txt` | Visual-by-visual dump of the v2.0 report (pre-v3.0). Historical. |
| `knowledge/daily-sales-v2/Sales_Report_xlsx_summary.md` | What the team tracks in Excel today (daily paid revenue by product line, excl. VAT, on paid date). |

The `knowledge/daily-sales/` folder holds older duplicates of the same files; the `daily-sales-v2/` versions are current.

---

## 11. Session 18 Oct 2026 (afternoon, cloud session, offline)

**What this session could reach:** Josh's repo `joshstevensonx/powerbi_v2` (a copy of `~/Desktop/powerbi`, pushed for this session) and nothing else. The Claude in Chrome tools and the Project files tool weren't available, so **nothing was changed in Power BI, the model or BigQuery**. Everything below is either ready to run or a proposal.

### 11.1 Drawer fix: `scripts/drawerfix.js` (ready, not yet run)
The fix is idea 1 from §6.6. On each of the 9 pages it:
- Adds a **Close filters** action button with the Filters button's exact spot (x24 y100 w150 h40), `isHidden:false` at load, a lower z than the Filters button and a link to *Close filters – <page>*. It also adds a hidden **"✕  Close filters"** textbox label, cloned from the "☰  Filters" label.
- **Open** bookmark now also hides the Filters button and its label and shows the close label. **Close** reverses that. All three are added to both bookmarks' `targetVisualNames` and `visualContainers` (hidden = `display:{mode:'hidden'}`). The close button itself isn't toggled, so it stays visible-at-load underneath.
- Removes the old ✕ and Done buttons, their labels and the Done bar shape, and takes them out of both bookmarks. Making them visible at load instead would leave transparent click targets over the KPI band and the content area while the drawer is closed.
- Raises the Filters button z only if a drawer visual overlaps the toggle spot, so the close button is on top while the drawer is open.
- Only clones existing visuals and edits name, position, text, bookmark link, title text and isHidden, so it adds no new visual properties. It checks that each page stays 1580×1148, the slicer count is unchanged, every bookmark target exists, and each page has exactly 1 Open and 1 Close button. Visual names are stable, so a re-run updates instead of duplicating. It drops `.platform`, keeps the pre-run definition in `window.__dfOrig` (undo: `await window.__dfRestore()`), and re-reads the report after the push.
- Tested offline only, in Node against a mock definition built like `redesign2.js` output: dry run, one-page push, idempotent re-run, refusal to run on any report other than 47b9663c. Not tested in the service.

**Run it (Chrome):**
1. Open app.powerbi.com, run `boot.js`, then `window.__R='47b9663c-4c3e-4039-84ab-f04d71d1570d'`.
2. Dry run on Overview: `window.__dfOnly=['<Overview page id>']` (the ids are in `redesign2.js` PAGES), run the script, then read `#__dump`. Expect `removed 5` (2 buttons, ✕, Done, shape) and no PROBLEMS.
3. Set `window.__dfPush=true` and run again. Open the build on Overview and **click with a real mouse**: Filters → drawer opens and the toolbar shows "✕ Close filters" → click it → drawer closes → repeat.
4. If that works: `window.__dfOnly=null`, run with push for all pages (Overview is a no-op on re-run). Then open, close, open, close by mouse on all 9 pages.
5. *Reset to default* (find "Reset to default" button, confirm Reset).
6. If the toggle also ignores clicks after the Close bookmark re-shows the Filters button, the "hidden at load" theory is incomplete. Next try is idea 2 (bookmark navigator).

### 11.2 Promotion of the redesign (Task B): **do not run without Josh's explicit approval**
Pre-checks in Chrome, not done yet: review all 9 pages, hover-test the tooltips (TT · Website traffic on the Website combo, devices, browsers, campaigns and source/medium tables; plus the 17 tooltip pages), drawer open/close by mouse on every page.

Exact steps (scripted in `scripts/promote_redesign.js`, which refuses to run unless `window.__promoteApproved='Josh approved <date/where>'`):
1. Clone live `d0210659-…` to **"Daily sales (v3.0) - backup before redesign <YYYY-MM-DD>"** (Power BI REST `reports/{id}/Clone`, same workspace, same model). The script stops if this fails.
2. getDefinition of the build `47b9663c-…`, drop `.platform` (so live keeps its name), updateDefinition onto live `d0210659-…` (same ID and URL). Re-read live to confirm it isn't corrupted. If it is, push the backup's definition back.
3. Open live, run **Reset to default**, then hover-test tooltips and open/close the drawer on a few pages. Tell viewers with saved state to use Reset to default once.

### 11.3 Report copies (Task C, proposal only; nothing deleted)
From this handover; not re-listed through the REST API (no Chrome).

| Copy | ID | Purpose | Proposal |
|---|---|---|---|
| Daily sales (v3.0) | d0210659-… | **Live** | keep |
| Daily Sales (v2.0) | 7e523292-… | Older live report on the same model | keep (ask Josh if still used) |
| Daily sales (v3.0) - backup 2026-10-18 | not recorded | Restore point before the header restyle | keep until the redesign is live and stable, then delete |
| Daily sales (v3.0) - backup before deep dive 2026-10-18 | 6f2a2242-… | Restore point before the deep dive promotion | keep until the redesign is live and stable, then keep only the newest backup |
| Daily sales (v3.0) - new layout preview | not recorded | GA page and grouped filters Josh rejected | delete if Josh agrees |
| Daily sales (v3.0) - deep dive build | 1d54745e-… | Same definition as live since 18 Oct | delete if Josh agrees. ⚠ `boot.js` defaults `__R` to this ID; change the default first |
| Daily sales (v3.0) - redesign build | 47b9663c-… | Redesign in progress | keep until promoted |
| *(model)* Daily sales (Model) v2.0 - definition backup 2026-10-18 | 38738a05-… | Model metadata restore point | keep |

### 11.4 BigQuery refresh cost (Task C, drafted, not deployed)
All of it is in `daily-sales-ga4/incremental/`; start with its README. In short:
- `daily_sales_ga4.ga_sessions_daily` / `ga_invoice_first_view`: partitioned tables.
- One copy of the logic in table functions. `tvf_invoice_views` = `ga_invoice_fixed.sql` plus a window. ⚠ `tvf_sessions` is rebuilt from the §5.10 column spec, because the original Sessions SQL isn't in the repo.
- Idempotent `load_*` procedures (delete and re-insert the window in one transaction). A daily scheduled query reloads the last 3 days.
- Views `v_ga_sessions` / `v_ga_invoice` add a live tail (last 3 days + intraday), so the report stays as current as now.
- `06_validate.sql` diffs old vs new. In Power BI only the SQL text in the two partitions changes, with the same columns and grain, so relationships and lookup columns are untouched.
- SQL not executed: no BigQuery access in this session. Needs Josh's go-ahead, the dataset location and a console check.

### 11.5 Model clean-up (Task C, proposal only; nothing deleted)
Based on the 7 Oct TMDL backup (`DailySales_docs/model_backup_2026-10-07_before_cleanup.tmdl` / `model.tmdl`) and the v2 doc's field usage. **Not yet checked:** Lineage view, and visual usage in the current v3.0 report. Both need Chrome. Do them before removing anything, then take a model definition backup.

**Propose removing:**

| Table | Why |
|---|---|
| Max sales previous wk, Max sales previous wk1 | No references from other tables. Broken (reference a missing `[Total new revenue]`). |
| Daily sessions - GA, Hourly sessions - GA, Conversion - GA, Transaction IDs - GA | Universal Analytics, dead since 2023/24, replaced by Sessions / GA_INVOICES. Nothing else references them. Their only relationships go to Calendar[Date]. |
| Daily budget by order& traffic (FY21), (FY22) | Out of date. Only relationships to Calendar[Date] and (FY22) Calculator[Product type]; no DAX references. |
| Mapping, Customer age grouping | No references anywhere in the model. |
| Level Of Detail | Unused field parameter (v2.0). Check the v3.0 report first; the Breakdown parameter replaced it there. |
| Empty / unused columns | `revenue_orders_tbl[Column]`, `[Column 3]`, `Paid_Rev`, `Unpaid_Cancelled_Rev`, `orders_invoices_tbl[today]`. Check DAX dependencies first. |

**Keep:**
- `Calculator` and `Order recurring amount` (Josh's request).
- `Combined_rev Summary 2`, `Combined_rev Summary 3` and `Invoice Revenue (improved)`, which Calculator's DAX uses. Note `Invoice Revenue (improved)` also has a relationship from `orders_invoices_tbl[order_invoiceid]`.
- Everything in §8's must-keep list.

Also: turn off Auto date/time (~59 hidden tables; likely needs Desktop, so download a fresh copy from the service first, §1 item 2). Hide the personal and payment columns in `Clients`.
