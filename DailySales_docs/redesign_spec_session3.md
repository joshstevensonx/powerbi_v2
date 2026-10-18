# Daily Sales (v2.0) — Redesign build spec (Session 3, 7 Oct 2026)

> Author: Claude (scheduled run for Josh Stevenson, Nexora Web Agency) · client 1-grid
> Source of truth: `DailySales_docs/Daily_Sales_v2_Documentation.md` (Notion: https://app.notion.com/p/Daily-Sales-v2-0-Semantic-Model-Data-Report-Documentation-3f22b1d10782808e8b90f7366f409f28)
> Target: a **copy** of report *Daily sales (v2.0)* named **Daily sales (v2.0) – Redesign** in workspace *BigQuery Reports*, live-connected to *Daily sales (Model) v2.0* (3647ff2a-…). **The shared semantic model is not changed.**
> Status: **spec only.** No Chrome browser was connected to this run (`list_connected_browsers` returned none), so the copy was not created or edited in the service. Build from this file.

---

## 0. Build order (≈ 2–3 h by hand)

1. Open *Daily sales (v2.0)* in the service › **File › Save a copy** › name `Daily sales (v2.0) – Redesign`, workspace *BigQuery Reports*. Edit only the copy.
2. **View › Themes › Customize current theme** (or Browse for theme) and apply the JSON in §8 (it extends the existing *1-grid Brand* theme; only the keys shown change).
3. Build the hidden **_Frame** page (§2) from TEMPLATE: header, filter rail, KPI row, note bar, page filters. Sync the slicers (§3).
4. Duplicate _Frame for each page in §4 and add the page visuals.
5. Build/repair tooltip pages (§5) and assign them.
6. Apply the fixes list (§6), delete the old pages (TEMPLATE → becomes _Frame; Data_Exploration, PRODUCT SALES, SALES TRENDS, CUSTOMER INSIGHTS, PRODUCT MIX are replaced).
7. Run the verification checklist (§7). Save. Do **not** publish over the live report.

Conventions: positions are `x, y, w, h` in px on a **1500 × 900** canvas (in the service Format › General › Properties types them as height · width · x · y — set size first, re-select, then position). "VC" = visual calculation (select visual › **New calculation**). VCs live inside the visual, so the shared model is untouched.

---

## 1. What the business values (from Sales_Report.xlsx + the beta report) and how v2.0 answers it

The Excel and the beta report were used only as evidence of what people look at; their layouts are **not** copied.

| # | Insight they rely on | Evidence | v2.0 treatment | Where |
|---|---|---|---|---|
| 1 | Daily paid new revenue, excl. VAT, on payment day | Excel *Daily Actual Sales* (Total Paid New Revenue), beta *Daily* | `[Paid Revenue (Products)]` is exactly this basis (paid, excl. VAT, Revenue Date = paid date) | KPI 1; Overview daily chart; Daily Sales table |
| 2 | Number of paid orders per day | Excel *No of paid Orders* | `[Paid Orders (Products)]` | KPI 2; Daily Sales table |
| 3 | Power BI vs actually paid — "% paid" | Excel *Paid tracker* (monthly 60–124 %), daily *Unpaid Orders* variance | Invoiced value by status per order-week + "% of invoiced value paid" (VC) | KPI 5 card; Collections page |
| 4 | Product split (13 columns) | Excel product columns; beta per-product pages | One Category › Sub category › Product matrix + sub-category bar for any day; synced product slicers replace per-product pages | Products; Daily Sales |
| 5 | Local vs international domains (R and count added) | Excel *Local / International Domains*, *No. of Local/Int. Domains Added* | `Domain Region` × paid revenue/orders; TLD top 10 | Products "Domains" block; Daily Sales columns |
| 6 | New-customer share of revenue ("New Revenue %") | Excel *New Revenue* column, beta "% new-customer revenue" MTD / yesterday | Card with `type_of_customer` categories + share VC; weekly 100 % column | KPI 4; Customers page |
| 7 | App sales | Excel *App Sales* | `Sales Channel` = App (signup_agent = App Sale) | KPI 6; Daily Sales column; Customers page |
| 8 | Average order value | implicit (revenue ÷ orders) | VC `DIVIDE([Paid Revenue (Products)],[Paid Orders (Products)])` | KPI 3; tables |
| 9 | Month-by-month trend, YoY % | Excel *Monthly Actual Sales*, *2025 Sales* | 13-month column chart with month-on-month VC; YoY only where data exists (≥ Jul 2026 vs Jul 2025) | Overview |
| 10 | Unpaid orders | Excel *Unpaid Orders*, v2.0 "Unpaid & Cancelled" | Split: Unpaid (collectable, amber) vs Cancelled (lost, red) | KPI 5; Collections |
| 11 | Decomposition month › product type | beta *Daily* page | Products matrix with drill + Decomposition tree on Products (explore) | Products |
| 12 | Services sold, still active? | Excel *Churn* | `service_status` of services sold in the period (100 % bar by category) — recent sales only | Products |
| 13 | December daily YoY | Excel *Dec Sales* | Daily Sales page with Period = December; same-day-LY available from Dec 2026 | Daily Sales |

### 1.1 Not supported by the current model (each needs a model/data change — BI-team sign-off)

| Insight | Why not | Change needed |
|---|---|---|
| Total active domains, net domain movement (local) | Model has new registrations only; no domain status history | Domain table from `tbldomains` (regdate, expirydate, status) + daily snapshot (active, added, lost) in Dremio |
| .co.za market share | External ZACR data | Monthly `Market Share` table (month, 1-grid domains, ZACR total) on SharePoint/Dremio |
| YoY for 2022 – Jun 2025 | `tblorders` Dremio view starts ~Jul 2025 | Widen the view to 2022 **or** import the Excel monthly totals as `Historical Monthly Sales` (month, category, R excl. VAT) |
| Churn by sales year (2022–2025 cohorts) | revenue_orders_tbl only covers orders from ~Jul 2025 | Add `create_date`/Sale Year to revenue_orders_tbl or a services-sold-by-year table from Combined Revenue |
| Midday view / time of day (beta) | `order_time` exists only in Combined Revenue | Carry `order_hour` into revenue_orders_tbl; then midday KPI + weekday × hour heatmap |
| Actual vs Budget (beta) | Budget tables are FY21/FY22 | Current `Budget` table (month, category, R excl. VAT) |
| Site traffic / conversion (beta) | GA tables use retired UA connector | GA4 connector or BigQuery export |
| Website Builder, DIFM, SSL, Company Registrations as their own lines | Folded into Sub Categories (Website Design, Security & Backup, Business Services) | Optional: split in the Sub Category DAX + Product Guide; until then use the **Product** slicer |
| Prior-period deltas on KPI cards (▲/▼ vs previous 30 days) | Needs a shifted date context — impossible in a visual calculation | Either 4 report-level measures (stored in the report, not the model; DAX in §9) **or** a model measure — Josh to decide |
| Excel "Power BI vs Paid" monthly variance | Excel "Power BI" column is a different (older) definition; v2.0 is already paid-only | Retire the Paid tracker once v2.0 is accepted, after a one-month parallel run |

**Headline:** the team's daily ritual is *"how much new money landed yesterday / this month, from how many orders, how much of it was new customers and app sales, and how many domains (local vs international)"*, plus a monthly *"did what we invoiced actually get paid"* check. All of that is answerable from revenue_orders_tbl; what isn't (active-domain base, market share, pre-Jul-2025 history, budget, time-of-day) needs new data, not new visuals.

---

## 2. Page frame (identical on every main page; build once on hidden page `_Frame`)

Canvas: Format page › Canvas settings › Custom 1500 × 900. Canvas background #F4F6F8, transparency 0 %. Wallpaper #F4F6F8.

| Element | Type | x, y, w, h | Content / formatting |
|---|---|---|---|
| Header band | Rectangle | 0, 0, 1500, 64 | Fill #FFFFFF, bottom border 1 px #E3E5E8 (line shape 0, 63, 1500, 1), no shadow |
| Accent bar | Rectangle | 0, 0, 6, 64 | Fill #00C1DE |
| Title | Text box | 24, 8, 700, 28 | "Daily Sales · {Page}" — "Daily Sales ·" Segoe UI Semibold 18 pt #00C1DE, page name Segoe UI Semibold 18 pt #231F20 |
| Subtitle (question) | Text box | 24, 34, 900, 22 | Page question, Segoe UI 10 pt #55565A |
| Data note | Card (new) | 1040, 14, 260, 36 | Value `revenue_orders_tbl[Revenue Date]` aggregated *Latest*, label "Data to"; value 11 pt #55565A, label 9 pt; no background/border; Period slicer interaction = None so it always shows the latest refresh date |
| Logo | Image (existing `1-grid_logo_resized`) | 1320, 14, 156, 36 | Maintain aspect ratio; no border |
| Rail panel | Rectangle | 16, 80, 224, 804 | White, 1 px #E3E5E8, radius 8 |
| Rail title | Text box | 28, 88, 200, 22 | "Filters" Semibold 11 pt #231F20 |
| Slicers 1–12 | Slicer | x 28, w 200; see §3 | Dropdown style unless noted |
| Clear all | Button (Clear all slicers) | 28, 828, 96, 28 | Text "Clear all", fill #FFFFFF, border #00C1DE 1 px, text #007E91 10 pt, radius 6 |
| Rail footnote | Text box | 28, 856, 200, 24 | "Excl. VAT · paid revenue on payment date" 8 pt #A7A8AB |
| KPI 1–6 | Card (new) | y 80, h 96, w 196, x = 256, 462, 668, 874, 1080, 1286 | §2.1 |
| Note bar | Text box / smart narrative | 256, 184, 1228, 28 | One sentence, 10 pt #55565A, white fill, 1 px #E3E5E8, radius 8, padding 6 |
| Content area | — | x 256 → 1484 (w 1228); row 1 y 220 h 330; row 2 y 562 h 322 | Gutter 12 px. Grids: **808 + 408** (x 256 / 1076) or **608 + 608** (x 256 / 876) or **400 × 3** (x 256 / 670 / 1084, w 400) |

Page-level filters on _Frame (and therefore every page): **none** except the drill-through well (Category, Product Name) on Products. Remove `invoice_total > 0` (both tables) and the empty `Status_Group` filter — the measures already exclude R0 and non-paid rows.
Report-level filters: keep `Calendar[Date (format)]` relative *last 4 years*; remove the redundant `Calendar[Year]` (all, inverted) filter.

### 2.1 KPI row (same six cards, same order, every page)

All are **Card (new)**. Style: white, 1 px #E3E5E8 border, radius 8, no shadow, padding 12 / 10; label 9 pt #55565A on top; callout value Segoe UI Semibold 24 pt #231F20; secondary/reference label 9 pt #55565A. Display units: R thousands with 1 decimal ("R143.9K") on cards.

| # | Card title | Data / categories | Visual calc / filter | Accent |
|---|---|---|---|---|
| 1 | Paid revenue | `[Paid Revenue (Products)]`; reference label `[Paid Orders (Products)]` "orders" | — | 3 px left accent #00C1DE (shape 256,80,3,96 etc.) |
| 2 | Paid orders | `[Paid Orders (Products)]` | — | #00C1DE |
| 3 | Average order value | `[Paid Revenue (Products)]`, `[Paid Orders (Products)]` (both hidden) | VC `AOV = DIVIDE([Paid Revenue (Products)], [Paid Orders (Products)])`, format `R #,##0` | #007E91 |
| 4 | New-customer share | Categories `revenue_orders_tbl[type_of_customer]`; value `[Paid Revenue (Products)]` (hidden) | VC `Share = DIVIDE([Paid Revenue (Products)], COLLAPSEALL([Paid Revenue (Products)], ROWS))` format `0.0%`; visual filter type_of_customer ≠ Unknown Customer; show categories New, Existing (New first, colour #00C18B / #007E91) | #00C18B |
| 5 | Unpaid · Cancelled | Categories `revenue_orders_tbl[Status_Filter]`; values `[Unpaid Revenue (Products)]`, `[Unpaid Orders (Products)]` | Visual filter **Status_Filter in {Unpaid, Cancelled}** (filter Status_Filter, *not* invoice_status — the measure overrides invoice_status). Unpaid label #F2A900, Cancelled #E5484D | #F2A900 |
| 6 | App sales | Categories `revenue_orders_tbl[Sales Channel]`; value `[Paid Revenue (Products)]` | VC `Share` (as card 4); visual filter Sales Channel = App; reference label = share | #55565A |

If the new card doesn't offer *New calculation* in your tenant: fall back to the report-level measures in §9 (stored in the report only) — or remove card 3 and show AOV in tables. Note in the KPI tooltip: "Orders containing several products count once per product in breakdowns."

---

## 3. Filter rail (fixed order, all synced)

Every slicer: header Semibold 10 pt #231F20, header text = the name below; values 10 pt; dropdown; search on; single-select off; **Selection-pane name = header text** (fixes "Date" names). **View › Sync slicers:** each slicer in its own sync group (group name = header), synced + visible on Overview, Daily Sales, Products, Customers & Channels, Collections. Tooltip pages and Guide not synced.

| # | Header | Field | Style | y (h 52 incl. header) |
|---|---|---|---|---|
| 1 | Period | `Calendar[Date (format)]` | **Relative date**, default *Last 30 days* (incl. today) — the only date slicer | 116 (h 60) |
| 2 | Category | `revenue_orders_tbl[Category]` | Dropdown | 182 |
| 3 | Sub category | `revenue_orders_tbl[Sub Category]` | Dropdown | 238 |
| 4 | Product | `revenue_orders_tbl[Product Name]` | Dropdown, search | 294 |
| 5 | Customer type | `revenue_orders_tbl[type_of_customer]` | Dropdown | 350 |
| 6 | Account age | `revenue_orders_tbl[customer_tenure_group]` (sort by customer_tenure_sort) | Dropdown | 406 |
| 7 | Sales channel | `revenue_orders_tbl[Sales Channel]` | Tile/buttons (Website, App) | 462 |
| 8 | Domain region | `revenue_orders_tbl[Domain Region]` | Tile (Local, International) | 518 |
| 9 | Province | `revenue_orders_tbl[client_state]` | Dropdown, search | 574 |
| 10 | Billing cycle | `revenue_orders_tbl[billing_cycle]` | Dropdown | 630 |
| 11 | Payment method | `revenue_orders_tbl[invoice_paymethod]` | Dropdown | 686 |
| 12 | Heard about us | `revenue_orders_tbl[heard_about_us]` | Dropdown, search | 742 |

Removed from rail (high-cardinality or duplicate): Client ID, Company, IP, Order ID, Invoice ID, Domain, Client Group ×3, Country, Service Status, the "Between" date slicer, second relative date slicer. Order/Invoice/Client ID search moves to the Collections chase table (table search via *Filter on this visual*).

---

## 4. Pages

Order of tabs: **Overview · Daily Sales · Products · Customers & Channels · Collections** · (hidden) Guide, TT - Category, TT - Period, Revenue Tooltip, _Frame.
Bars: data labels on, value axis off, category axis 9 pt, gridlines off. Columns/lines: Y axis on (9 pt, dotted #E3E5E8 gridlines), axis titles off. Legend top-left, no title. Titles: Semibold 12 pt #231F20, one-line question; subtitle 9 pt #55565A where noted.

### 4.1 Overview — "Are paid sales on track this period, and what is driving them?"

Note bar: Smart narrative (summarise visual 1) **or** static text "Hover any chart for detail · Excl. VAT, on payment date".

| # | Visual | x, y, w, h | Fields | VC / settings | Tooltip |
|---|---|---|---|---|---|
| O1 | Line & clustered column — "How much was paid each day?" | 256, 220, 808, 330 | X `Calendar[Date (format)]` (continuous off, type categorical, dd MMM); Columns `[Paid Revenue (Products)]` #00C1DE; Line `[Paid Orders (Products)]` #55565A (secondary axis, axis hidden) | VC `7-day avg = MOVINGAVERAGE([Paid Revenue (Products)], 7)` as a line #007E91 dashed 2 px on primary axis | TT - Period |
| O2 | Clustered bar — "Which categories earned it?" | 1076, 220, 408, 330 | Y `Category`; X `[Paid Revenue (Products)]` sorted desc | VC `% of total = DIVIDE([Paid Revenue (Products)], COLLAPSEALL([Paid Revenue (Products)], ROWS))` shown as detail label (data label: value + VC, "R12.3K · 21%"); hide VC from axis | TT - Category |
| O3 | Clustered column — "How do the last 13 months compare?" | 256, 562, 604, 322 | X `Calendar[MonthYear]` (sort by MonthYearNum); Y `[Paid Revenue (Products)]` | Visual-level filter `Calendar[Date (format)]` relative *in the last 13 calendar months (incl. current)*; with the Period slicer selected, Format › Edit interactions › set this visual to **None**. VC `MoM % = DIVIDE([Paid Revenue (Products)] - PREVIOUS([Paid Revenue (Products)]), PREVIOUS([Paid Revenue (Products)]))` (0.0 %) shown as tooltip and data label below value. Subtitle "Last 13 months · current month to date". YoY (`PREVIOUS(...,12)`) only becomes meaningful from Jul 2026 vs Jul 2025 | TT - Period |
| O4 | Clustered bar — "Which products sold most?" | 872, 562, 300, 322 | Y `Product Name`; X `[Paid Revenue (Products)]`; Top N 5 | data labels R | TT - Category |
| O5 | Donut — "New or existing customers?" | 1184, 562, 300, 322 | Legend `type_of_customer`; Values `[Paid Revenue (Products)]` | Colours New #00C18B, Existing #007E91, Unknown #A7A8AB; labels % only; inner radius 65 % | TT - Category |

### 4.2 Daily Sales — "What sold each day, and how much of it was new, app and domain business?"

This replaces the Excel *Daily Actual Sales* sheet without copying its 13 product columns.

| # | Visual | x, y, w, h | Fields | VC / settings | Tooltip |
|---|---|---|---|---|---|
| D1 | Matrix — "Day by day" | 256, 220, 808, 664 | Rows `Calendar[Date (format)]`; Values `[Paid Revenue (Products)]` "Paid R", `[Paid Orders (Products)]` "Orders" | VCs (axis ROWS, which follows the visual's sort — keep date **ascending** so PREVIOUS = the day before): `AOV = DIVIDE([Paid Revenue (Products)],[Paid Orders (Products)])`; `vs prev day = [Paid Revenue (Products)] - PREVIOUS([Paid Revenue (Products)])`; `7-day avg = MOVINGAVERAGE([Paid Revenue (Products)], 7)`. Data bars on Paid R (#7FDFEE). Conditional font colour on "vs prev day": ≥0 #00845F, <0 #E5484D. Row subtotal = Total (top). Column headers word-wrap; values 10 pt; alternating rows off; grid horizontal #E3E5E8 | TT - Period |
| D2 | Clustered bar — "What sold on the selected day(s)?" | 1076, 220, 408, 330 | Y `Sub Category`; X `[Paid Revenue (Products)]` | Cross-filtered by D1 row click; data labels | TT - Category |
| D3 | Matrix — "Local vs international domains by day" | 1076, 562, 408, 322 | Rows `Calendar[Date (format)]`; Columns `Domain Region` (Local, International); Values `[Paid Revenue (Products)]` "R", `[Paid Orders (Products)]` "Added" | Visual filter Domain Region is not blank; values 9 pt; column subtotals off, row total on | TT - Period |

*Why not one wide table with New %, App R, Local/Int domains?* Each needs a different filter on the same measure; a visual calculation cannot filter. Splitting into D1 (totals) + D3 (domain split) + KPIs 4/6 (new share, app share for the selected days) covers all Excel columns. Clicking a day in D1 filters the KPI row to that day — that is the "yesterday" view the beta page had.

### 4.3 Products — "Which products earn the revenue, and is the mix changing?"

Drill-through target: Category, Product Name (keep). Back button 1440, 186, 40, 24 (only shows on drill-through).

| # | Visual | x, y, w, h | Fields | VC / settings | Tooltip |
|---|---|---|---|---|---|
| P1 | Matrix — "Category › sub category › product" | 256, 220, 808, 330 | Rows `Category Hierarchy` (Category › Sub Category › Product Name); Values `[Paid Revenue (Products)]` "Revenue", `[Paid Orders (Products)]` "Orders" | VCs `% of total = DIVIDE([Paid Revenue (Products)], COLLAPSEALL([Paid Revenue (Products)], ROWS))` (0.0 %), `% of parent = DIVIDE([Paid Revenue (Products)], COLLAPSE([Paid Revenue (Products)], ROWS))`, `AOV`. Stepped layout, +/- icons on, expand to Category. Data bars on Revenue. Footnote text box under it: "Orders count once per product — category orders add to more than the total." | Revenue Tooltip |
| P2 | Stacked column — "Is the category mix shifting?" | 1076, 220, 408, 330 | X `Calendar[WeekDate]`; Legend `Category`; Y `[Paid Revenue (Products)]` | Fixed category colours (§8); Y axis on | TT - Period |
| P3 | Clustered bar — "Local or international domains?" | 256, 562, 400, 322 | Y `Domain Region`; X `[Paid Revenue (Products)]`; tooltips `[Paid Orders (Products)]` | Local #00C1DE, International #007E91 via conditional formatting by field value; data label R; subtitle "Orders = paid domain registrations" | TT - Category |
| P4 | Clustered bar — "Which TLDs sell?" | 670, 562, 400, 322 | Y `TLD`; X `[Paid Revenue (Products)]`; Top 10 | — | TT - Category |
| P5 | 100 % stacked bar — "Are services sold this period still active?" | 1084, 562, 400, 322 | Y `Category`; Legend `service_status`; X `[Paid Orders (Products)]` | Active #00C18B, Pending #7FDFEE, Suspended #F2A900, Cancelled/Terminated #E5484D, others #A7A8AB | TT - Category |

Optional explore tab inside P1 position via bookmark toggle: Decomposition tree (Analyse `[Paid Revenue (Products)]`, Explain by Category, Sub Category, Product Name, billing_cycle, base_or_addon) — replaces beta *Daily* decomposition tree.

### 4.4 Customers & Channels — "Who is buying, how established are they, and through which channel?"

| # | Visual | x, y, w, h | Fields | VC / settings | Tooltip |
|---|---|---|---|---|---|
| C1 | 100 % stacked column — "Is the new-customer share growing?" | 256, 220, 808, 330 | X `Calendar[WeekDate]`; Legend `type_of_customer`; Y `[Paid Revenue (Products)]` | New #00C18B bottom, Existing #007E91, Unknown #A7A8AB; data labels inside (New only) | TT - Period |
| C2 | Clustered bar — "What do new vs existing customers buy?" | 1076, 220, 408, 330 | Y `Category`; Legend `type_of_customer`; X `[Paid Revenue (Products)]` | Filter type_of_customer ≠ Unknown | TT - Category |
| C3 | Clustered bar — "How old are buying accounts?" | 256, 562, 400, 322 | Y `customer_tenure_group` **sorted by customer_tenure_sort** (axis sort by the column's sort-by; do not sort by value); X `[Paid Revenue (Products)]` | Bars #00C1DE, "New" bar #00C18B | TT - Category |
| C4 | Clustered bar — "Website, app or agent?" | 670, 562, 400, 322 | Y `signup_agent`; X `[Paid Revenue (Products)]`; tooltips `[Paid Orders (Products)]` | VC `% of total` in label | TT - Category |
| C5 | Clustered bar — "Which marketing sources bring revenue?" | 1084, 562, 400, 322 | Y `heard_about_us`; X `[Paid Revenue (Products)]`; Top 8 | "Did not say how" bar #A7A8AB (conditional format) | TT - Category |

Province: available via the rail slicer and TT - Category; a Top-12 province bar can replace C5 via bookmark if marketing asks.

### 4.5 Collections — "How much invoiced value is still uncollected, and where?"

Basis note in the note bar: **"Invoice value by order date (cohort). Paid revenue elsewhere is by payment date, so totals differ."**

| # | Visual | x, y, w, h | Fields | VC / settings | Tooltip |
|---|---|---|---|---|---|
| L1 | Stacked column — "Is invoiced value being collected?" | 256, 220, 808, 330 | X `Calendar[WeekDate]`; Legend `Status_Filter`; Y `[RO Invoice Total]` | Paid #00C1DE, Unpaid #F2A900, Cancelled #E5484D, Refunded/Collections/other #A7A8AB. VC (tooltip) `% paid` cannot filter by status → use L2 for rates | TT - Period |
| L2 | Clustered bar — "Which payment methods get paid?" | 1076, 220, 408, 330 | Y `invoice_paymethod`; X `[Paid Invoice Total]`, `[RO Invoice Total]` (hidden) | VC `% paid = DIVIDE([Paid Invoice Total], [RO Invoice Total])` shown as the bar (hide the two base measures); sort by VC asc; data labels 0 %; reference line at overall value not available in VC → subtitle states overall % | TT - Category |
| L3 | Clustered bar — "Where is unpaid and cancelled value?" | 256, 562, 604, 322 | Y `Category`; Legend `Status_Filter`; X `[Unpaid Revenue (Products)]` | Visual filter Status_Filter in {Unpaid, Cancelled}; amber / red | TT - Category |
| L4 | Table — "Open invoices to chase (top 50)" | 872, 562, 612, 322 | `order_id`, `invoice_id`, `client_id`, `Category`, `invoice_date`, `invoice_duedate`, `invoice_paymethod`, `[Unpaid Revenue (Products)]` | Visual filter Status_Filter = Unpaid; Top N 50 by `[Unpaid Revenue (Products)]`; sort desc; values 9 pt; due date conditional font red if < today (rule on date not available → leave) | — |

### 4.6 Hidden pages

- **Guide** (720 × 430): keep; restyle table header #00C1DE fill, white Semibold text; Back button.
- **_Frame**: the frame only (from TEMPLATE), for future pages.

---

## 5. Tooltip pages and mapping

| Page | Canvas | Content | Assigned to |
|---|---|---|---|
| **TT - Category** (keep) | 320 × 240, page type Tooltip, background #FFFFFF | Card (new) 8, 8, 304, 72: `[Paid Revenue (Products)]`, `[Paid Orders (Products)]`, `[Unpaid Revenue (Products)]` (values 16 pt; Unpaid label #F2A900). Bar 8, 88, 304, 144: Top 5 `Product Name` by `[Paid Revenue (Products)]`, title "Top products" | O2, O4, O5, D2, P3, P4, P5, C2–C5, L2, L3 |
| **TT - Period** (rename TT - Week) | 320 × 260 | Same 3 KPI values + bar of `Category` by `[Paid Revenue (Products)]` | O1, O3, D1, D3, P2, C1, L1 |
| **Revenue Tooltip** (fix) | 400 × 300 (was 1280 × 720) | Matrix rows Sub Category › Product Name; values **`[Paid Revenue (Products)]`, `[Paid Orders (Products)]`** (replace Sum(invoice_total) / Count(order_id)); remove its own tooltip → Guide; remove visual filter Status_Group (measure is paid-only) | P1 |

Each target visual: Format › General › Tooltips › Type **Report page** › Page as above. Tooltip pages: Allow use as tooltip ON, filters on Auto.

---

## 6. Fixes to documentation §11 issues

| Issue | Fix |
|---|---|
| Revenue Tooltip implicit Sum(invoice_total) / Count(order_id) | Measures (§5) |
| Relative date slicer header "Product Category" | Single relative slicer headed "Period" |
| "Billling Cycle" typo, duplicate slicers (Billing ×3, Client Group ×3, Channel ×2) | One slicer per field (§3) |
| All slicers named "Date" in Selection pane | Name = header text; group visuals in Selection pane: Header, Rail, KPIs, Content |
| Duplicate `invoice_total > 0` page filters, empty Status_Group filter | Removed (measures already exclude R0 / non-paid) |
| Empty Data_Exploration matrix | Page deleted (Daily Sales replaces it) |
| Unsynced date slicers defaulting to Last 1 Days | One synced Period slicer, Last 30 days |
| Inconsistent tooltip pages | Mapping §5 |
| Unpaid + Cancelled lumped together | KPI 5 and L3 split by Status_Filter |
| "New"/"Existing" cards identical to Paid | KPI 4 share card; card filters on orders_invoices_tbl removed |
| Category bars ≠ Paid card (R532K vs R518.6K) | Cards no longer carry `orders_invoices_tbl[invoice_status]=Paid` visual filters — same filter context as charts. Re-check in §7 |
| Invoice-status colours | Fixed by value in §8 + per-visual |
| Unused custom visuals (Enlighten Slicer, Simple Waterfall) | Remove from the copy (Visualizations › … › Remove) |
| Bookmark 1 targets one visual on Guide | Delete or rename "Guide – all" |

---

## 7. Verification

### 7.1 Reconciliation (re-derived 7 Oct 2026 from `paid_orders_(01:09)-(29:09).csv`)

| Basis | Orders | Value |
|---|---|---|
| WHMCS extract: paid, invoice > R0, **order date** 1–29 Sep 2026, **incl. VAT** | 588 | R143,924.45 ✔ (brief) |
| Same, ÷ 1.15 (approx. excl. VAT) | 588 | ≈ R125,151.70 — exact value uses invoice_subtotal → `[Paid Invoice Revenue]` |
| Of those, paid by 29 Sep (incl. VAT) | 573 | R141,397.52 |
| Sept orders by status (order date ≤ 29 Sep, incl. VAT, `september_orders.csv`) | Paid 587 · Unpaid 129 · Cancelled 37 · Refunded 1 | R143,825 · R51,222 · R14,374 · R92 → **≈ 68.6 % of invoiced value paid** |

The report cards (`[Paid Revenue (Products)]`) are excl. VAT **on paid date**, so they will not equal R125.2K: August orders paid in September are in; September orders paid in October are out. Run this read-only query in the copy (or Desktop DAX query view) and record it as the new baseline:

```dax
EVALUATE
CALCULATETABLE (
    ROW ( "Paid Orders (order date)", [Paid Orders],
          "Paid Invoice Revenue (order date, excl VAT)", [Paid Invoice Revenue],
          "Paid Revenue (Products) (paid date, excl VAT)", [Paid Revenue (Products)],
          "Paid Orders (Products)", [Paid Orders (Products)] ),
    DATESBETWEEN ( 'Calendar'[Date (format)], DATE ( 2026, 9, 1 ), DATE ( 2026, 9, 29 ) )
)
```
Expected: `[Paid Orders]` = 588; `[Paid Invoice Revenue]` ≈ R125.15K.

### 7.2 Click-through checklist (per page)

1. Period = 1–29 Sep (use Between temporarily or relative "Last 1 month" on 30 Sep): KPI 1 = sum of O2 bars = P1 total = D1 total (same measure, no extra filters). Note any gap.
2. Select Category = Domains: every visual + KPIs respond; P3/P4 still populated; L1 changes.
3. Select Customer type = New: KPI 4 shows 100 % New; C1 all green.
4. Sales channel = App: KPI 6 = KPI 1.
5. Click a day in D1: KPIs, D2, D3 filter to that day.
6. Hover each chart: correct tooltip page; Revenue Tooltip shows R excl. VAT (not inflated).
7. Switch pages: rail selections persist (sync groups).
8. Products: right-click a product › Drill through › Products works; Back button returns.
9. Collections: L1 Paid + Unpaid + Cancelled for Sep order weeks ≈ 68–70 % paid; L4 shows only Unpaid.
10. Performance analyzer: every visual < 1 s (D1 with ~30 rows; avoid > 400 days).

---

## 8. Theme JSON (merge into "1-grid Brand")

```json
{
  "name": "1-grid Brand",
  "dataColors": ["#00C1DE","#007E91","#55565A","#00C18B","#7FDFEE","#00845F","#A7A8AB","#B3ECF5","#7FE0C5","#231F20","#F2A900","#E5484D"],
  "foreground": "#231F20", "foregroundNeutralSecondary": "#55565A", "foregroundNeutralTertiary": "#A7A8AB",
  "background": "#FFFFFF", "backgroundLight": "#F4F6F8", "backgroundNeutral": "#E3E5E8",
  "tableAccent": "#00C1DE", "good": "#00845F", "neutral": "#F2A900", "bad": "#E5484D",
  "maximum": "#00C1DE", "center": "#B3ECF5", "minimum": "#FFFFFF",
  "textClasses": {
    "title": {"fontFace": "Segoe UI Semibold", "fontSize": 12, "color": "#231F20"},
    "label": {"fontFace": "Segoe UI", "fontSize": 9, "color": "#55565A"},
    "callout": {"fontFace": "Segoe UI Semibold", "fontSize": 24, "color": "#231F20"},
    "header": {"fontFace": "Segoe UI Semibold", "fontSize": 10, "color": "#231F20"}
  },
  "visualStyles": {
    "*": {"*": {
      "background": [{"show": true, "color": {"solid": {"color": "#FFFFFF"}}, "transparency": 0}],
      "border": [{"show": true, "color": {"solid": {"color": "#E3E5E8"}}, "radius": 8, "width": 1}],
      "dropShadow": [{"show": false}],
      "padding": [{"top": 12, "bottom": 8, "left": 14, "right": 14}],
      "title": [{"show": true, "fontSize": 12, "fontFamily": "Segoe UI Semibold", "fontColor": {"solid": {"color": "#231F20"}}, "titleWrap": false}],
      "subTitle": [{"fontSize": 9, "fontColor": {"solid": {"color": "#55565A"}}}],
      "legend": [{"show": true, "position": "TopLeft", "showTitle": false, "fontSize": 9}],
      "categoryAxis": [{"showAxisTitle": false, "fontSize": 9, "gridlineShow": false}],
      "valueAxis": [{"showAxisTitle": false, "fontSize": 9, "gridlineStyle": "dotted", "gridlineColor": {"solid": {"color": "#E3E5E8"}}}],
      "labels": [{"fontSize": 9, "color": {"solid": {"color": "#55565A"}}}]
    }},
    "barChart": {"*": {"valueAxis": [{"show": false}], "labels": [{"show": true}]}},
    "clusteredBarChart": {"*": {"valueAxis": [{"show": false}], "labels": [{"show": true}]}},
    "page": {"*": {"background": [{"color": {"solid": {"color": "#F4F6F8"}}, "transparency": 0}], "outspace": [{"color": {"solid": {"color": "#F4F6F8"}}}]}},
    "slicer": {"*": {"border": [{"show": false}], "padding": [{"top": 0, "bottom": 0, "left": 0, "right": 0}], "header": [{"fontSize": 10, "fontFamily": "Segoe UI Semibold"}]}},
    "textbox": {"*": {"background": [{"show": false}], "border": [{"show": false}]}},
    "shape": {"*": {"border": [{"show": false}]}},
    "image": {"*": {"background": [{"show": false}], "border": [{"show": false}]}}
  }
}
```

**Fixed colours by value** (set per visual with Format › Columns/Bars › colour per category; the theme can't bind a value to a colour):

| Field | Value → colour |
|---|---|
| Category | Domains #00C1DE · Application Hosting #007E91 · Infrastructure Hosting #55565A · Web Services #00C18B · Security & Backup #7FDFEE · Business Services #00845F · Not in Combined Revenue #A7A8AB |
| type_of_customer | New Customer #00C18B · Existing Customer #007E91 · Unknown Customer #A7A8AB |
| Status_Filter / invoice_status | Paid #00C1DE · Unpaid #F2A900 · Cancelled #E5484D · Refunded / Collections / Payment Pending / Draft #A7A8AB |
| Domain Region | Local #00C1DE · International #007E91 |
| Sales Channel | Website #00C1DE · App #55565A |

Contrast: #231F20 and #55565A on white pass 4.5:1; #00C1DE text fails on white (≈2.3:1) — use cyan only for the title prefix (18 pt, large text) and for marks, never for small labels; use #007E91 for cyan-coloured small text.

---

## 9. Optional report-level measures (Open decision 1)

Stored **in the report** (Modeling › New measure in the live-connected report; they do not appear in the shared model). Only needed for KPI deltas vs prior period, or if cards refuse visual calculations.

```dax
Paid Revenue PP =
VAR _min = MIN ( 'Calendar'[Date (format)] )
VAR _max = MAX ( 'Calendar'[Date (format)] )
VAR _len = INT ( _max - _min ) + 1
RETURN CALCULATE ( [Paid Revenue (Products)], DATESBETWEEN ( 'Calendar'[Date (format)], _min - _len, _min - 1 ) )

Paid Revenue Δ% = DIVIDE ( [Paid Revenue (Products)] - [Paid Revenue PP], [Paid Revenue PP] )

AOV (report) = DIVIDE ( [Paid Revenue (Products)], [Paid Orders (Products)] )

New-customer share (report) =
DIVIDE ( CALCULATE ( [Paid Revenue (Products)], revenue_orders_tbl[type_of_customer] = "New Customer" ), [Paid Revenue (Products)] )
```
Note: `Paid Revenue (Products)` already removes Calendar filters and re-applies dates through TREATAS on Revenue Date, so DATESBETWEEN on `Date (format)` feeds `_dates` correctly. Validate PP against a manual 30-day sum before use.

---

## 10. Open decisions for Josh

1. **KPI deltas**: allow the 4 report-level measures in §9 (report only, model untouched)? Without them, KPIs show values without ▲/▼; change is visible in charts (7-day avg, MoM).
2. **New baseline**: confirm the paid-date, excl.-VAT figure from §7.1 as the agreed reconciliation number (replaces 588 / R143,924.45 incl. VAT, order date).
3. **Domains added** = paid domain registrations on paid date (v2.0) vs all registrations (Excel)? Pick one definition.
4. **Retire Excel trackers** after a one-month parallel run (Paid tracker especially).
5. **Model backlog** (§1.1) — which to request from BI first: recommend (a) historical monthly sales import for YoY, (b) domain status snapshot, (c) order_hour.
6. **Archive the beta report** once v2.0 – Redesign is accepted.
