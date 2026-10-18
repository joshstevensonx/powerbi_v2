# Daily Sales v2.0 – Redesign Handoff (Session 2)

Oct 6, 2026 · @josh

## Status summary (Sessions 1–2)

As of 6 Oct 2026 the redesign in the live report was part-done and **unsaved**. Three pages had been added from the template (SALES TRENDS, CUSTOMER INSIGHTS, PRODUCT MIX) and the 1-grid Brand theme had been applied. The left filter rail was half-built on SALES TRENDS. Summarised from the Session 1–2 handoff (`DailySales_docs/context/redesign_handoff_session1_2.txt`).

- Saved: nothing. The edits were left for review in the Power BI service.
- Done: brand theme; three new pages; slicer audit; a fix so every slicer reaches the trend chart; removal of a stray hidden chart.
- Interrupted: moving 17 slicers into a 224 px left rail on SALES TRENDS (eight slicers resized, not yet moved).

## Completed work per page (Sessions 1–2)

| Page | What was built |
| --- | --- |
| SALES TRENDS | Weekly paid revenue (bars) vs orders (line); revenue by category; weekly category mix; weekly invoice value by status |
| CUSTOMER INSIGHTS | Weekly new-customer share; what new vs existing buy; account tenure; top 12 provinces; heard-about-us; sign-up channel |
| PRODUCT MIX | Category › sub-category treemap; top 10 products; billing-cycle mix; base vs add-on share |
| All pages | 1-grid Brand theme (cyan #00C1DE, grey #55565A, green #00C18B, amber #F2A900 unpaid, red #E5484D cancelled) |

## Remaining work at the end of Session 2

1. Finish the filter rail and content layout on SALES TRENDS; page background #F4F6F8.
2. Restyle the KPI cards; split Unpaid from Cancelled.
3. Re-check series colours (Cancelled red, Unpaid amber).
4. Build tooltip pages TT – Category and TT – Week and assign them.
5. Copy the frame to the other pages.
6. Cut visual noise: value axis off where labels are on, one-line titles, tenure sorted by customer\_tenure\_sort.
7. Rename the slicers (all called "Date").

All seven are covered by the Session 3 redesign below.

## Spec values and gotchas (Sessions 1–2)

- Canvas 1500 × 900; positions in the service are typed as height · width · x · y. Set the size first, then reselect and set the position.
- Every slicer is named "Date" in the Selection pane, except Country. Find slicers by position.
- Page filters `invoice_total > 0` appear twice (both tables), plus an empty Status\_Group filter.
- Unexplained gap: category bars ≈ R532K vs Paid card R518.6K over 90 days.
- Relative date slicers are not synced and default to Last 1 Days.

# Session 3 — 7 Oct 2026

Oct 7, 2026

## Summary

The report was regenerated as a **separate copy**, `Daily sales (v2.0) – Redesign.pbix`, with 5 visible pages built on one frame: Overview, Daily Sales, Products, Customers & Channels, Collections. It is live-connected to the shared model, which was **not changed**. The 37 new calculations are report-level measures stored in the report.

- **Built:** generated from the report's PBIR definition and validated against Microsoft's PBIR schemas. It has **not yet been opened, published or clicked through** in Power BI: this session ran in the cloud with no browser or Power BI Desktop, so the "Save a copy" route in the service wasn't possible.
- **Live report:** untouched. The copy has no link to the live report's ID, so publishing it creates a new report, **Daily sales (v2.0) – Redesign**.
- **Next step for Josh:** open the .pbix in Power BI Desktop, check it, publish to BigQuery Reports, then run the checklist under Verification. If the file won't open, rebuild from `DailySales_docs/redesign_spec_session3.md` (exact positions, fields, DAX and theme).

## What the business values (Excel + beta report)

Headline: the team runs on **daily paid new revenue (excl. VAT, on payment day), paid orders, how much of what was invoiced got paid, local vs international domains, the new-customer share and app sales**. The product split matters, but as a breakdown, not as 13 fixed columns. v2.0 now shows all of these. The Excel was used only as evidence; its daily grid and tracker sheets were not copied.

| Insight they rely on (source) | Status | Where in v2.0 |
| --- | --- | --- |
| Daily paid new revenue, excl. VAT, payment day (Excel Daily Actual Sales; beta Daily) | Covered | KPI Paid revenue; Overview daily chart; Daily Sales table |
| Paid orders per day (Excel) | Covered | KPI Paid orders; Daily Sales table |
| Invoiced vs paid, % paid (Excel Paid tracker, daily variance) | Covered | Daily Sales "Invoiced" and "% paid" columns; Collections page |
| Unpaid orders (Excel) | Improved | Separate Unpaid (collectable, amber) and Cancelled (lost, red) KPIs; chase list |
| Product split, 13 columns (Excel) | Re-expressed | Category › Sub category › Product matrix; sub-category bar per day; synced product slicers |
| Local vs international domains, R and number added (Excel) | Covered | Products domain block; Daily Sales columns; Domain region slicer (counts = paid registrations) |
| New-revenue % (Excel) | Covered | KPI New-customer share with change in points; donut; weekly share |
| App sales (Excel) | Covered | Daily Sales column; Customers channel chart; Overview sentence |
| Monthly sales with YoY (Excel Monthly / 2025 Sales) | Partial | Overview 13-month chart with "same month last year"; the LY line fills in from Jul 2026 |
| Period comparison | Covered | Every KPI shows change vs the prior period of equal length |
| Decomposition month › product type (beta) | Re-expressed | Products matrix drill with % of total and change |
| Per-product pages: Domains, Web builder, Web design, Email (beta) | Via filters | One Products page plus synced Category / Sub category / Product slicers |
| Services sold by status (Excel Churn) | Partial | Products "Are services sold this period still active?" |
| December daily YoY (Excel Dec Sales) | From Dec 2026 | Daily Sales with Period = December; LY measure compares with Dec 2025 |

## Not supported yet, and the change each needs

Each of these changes the shared model, so it needs BI-team sign-off.

| Insight | Why not | Change needed |
| --- | --- | --- |
| Total active domains, net domain movement | Only new registrations are in the model; there is no domain status history | Domains table from tbldomains (registration, expiry, status) plus a daily snapshot (active, adds, losses) |
| Market share (.co.za) | External ZACR data | Monthly Market Share table on SharePoint or Dremio, keyed by month |
| YoY for 2022 – Jun 2025 | The tblorders Dremio view starts \~Jul 2025 | Widen the view to 2022, or import the Excel monthly totals as a Historical Monthly Sales table |
| Churn by sales year | revenue\_orders\_tbl has no service registration date for older rows | Add create\_date and a Sale Year column; Services Sold by create date |
| Midday view / time of day (beta) | order\_time isn't carried into revenue\_orders\_tbl | Add order\_hour; then a midday KPI and a weekday × hour heatmap |
| Actual vs Budget (beta) | Budget tables are FY21/FY22 | Current Budget table (month, category, R excl. VAT) |
| Site traffic (beta) | GA tables use the retired UA connector | GA4 connector or BigQuery export |
| Website Builder and DIFM as their own lines | Both sit in Sub Category "Website Design" | Optional: split them in the Sub Category DAX and the Product Guide |
| Domains added: all registrations vs paid only | v2.0 counts paid registrations on paid date; Excel likely counts all | Decision for Josh (see Open decisions) |

## Page-by-page design

Every main page shares one frame: header (title, question subtitle, period and "Data to …" note, logo), a 224 px filter rail, the same six KPI cards, a one-line insight or note, and two chart rows on an 808 + 408 or 604 + 612 grid. Canvas 1500 × 900.

| Page | Question | Visuals (row 1 → row 2) |
| --- | --- | --- |
| Overview | Are paid sales on track this period, and what is driving them? | Auto insight sentence · daily paid revenue (bars) + orders (line) · revenue by category · 13-month trend vs same month last year (ignores the Period slicer) · top 5 products · new vs existing donut |
| Daily Sales | What sold each day? | Day-by-day table (latest first): paid R, orders, AOV, new-customer %, app sales, local/int. domains R and #, invoiced, % paid · sub-category bar for the selected day(s) · revenue by weekday |
| Products | Which products earn the revenue, and is the mix changing? | Category › sub category › product matrix (R, % of total, orders, AOV, vs prior period) · domain block (local vs international R and number added) · top 8 TLDs · status today of services sold |
| Customers & Channels | Who is buying, how established, through which channel? | Weekly new-customer share · what new vs existing buy · account age (sorted by tenure) · Online / Agent / App Sale · top 8 marketing sources |
| Collections | How much invoiced value is still uncollected, and where? | Weekly invoice value by status (by order week) · % paid by payment method · unpaid vs cancelled by category · top 50 open invoices to chase |
| Hidden | — | Guide (unchanged), TT - Category, TT - Period (was TT - Week), Revenue Tooltip (fixed), \_Frame template |

KPI row on every page: **Paid revenue · Paid orders · Average order value · New-customer share** (each with ▲/▼ vs the prior period, green or red) **· Unpaid (collectable) · Cancelled (lost)** (each with its order count).

Wireframes (layout only; the real visuals render in Power BI):

&#91;image: Overview wireframe\]

&#91;image: Daily Sales wireframe\]

&#91;image: Products wireframe\]

&#91;image: Customers & Channels wireframe\]

&#91;image: Collections wireframe\]

## Design system, filter rail and tooltips

| Element | Spec |
| --- | --- |
| Colours | Primary cyan #00C1DE (paid, main series) · cool grey #55565A (secondary, labels) · green #00C18B (new customers; up-arrows in dark green #00845F) · text #231F20 · amber #F2A900 unpaid · red #E5484D cancelled / down · border #E3E5E8 · page #F4F6F8 |
| Fixed colours by value | Category: Domains #00C1DE, Application Hosting #007E91, Infrastructure Hosting #55565A, Web Services #00C18B, Security & Backup #7FDFEE, Business Services #00845F, Not in Combined Revenue #A7A8AB · Customer: New #00C18B, Existing #007E91, Unknown #A7A8AB · Status: Paid cyan, Unpaid amber, Cancelled red, Refunded grey |
| Type | Segoe UI. Page title Semibold 18 pt ("Daily Sales" cyan + page name black); subtitle 10 pt grey; visual titles Semibold 12 pt, one line, a question; KPI value Semibold 24 pt; labels 9 pt grey |
| Spacing | Header 0–64; rail x 16, w 224; content x 256–1484; KPI row y 80, h 100 (6 × 196 + 10 px gaps); note y 188; chart rows y 226 and 561, h 323; 12 px gutters |
| Card | White, 1 px #E3E5E8 border, radius 8, no shadow, padding 12/8/14; data labels instead of value axes on bars; axis titles off; dotted gridlines only where an axis is shown; legend top, no title. Also set as theme defaults. |

**Filter rail** (same order on every page; every slicer is in a sync group, so selections follow you between pages):

1. Period: relative date, default Last 30 days
2. Category
3. Sub category
4. Product
5. Customer type
6. Account age
7. Sales channel
8. Domain region
9. Province
10. Billing cycle
11. Payment method
12. Heard about us

The rail also has a *Clear all* button and a footnote: "Values excl. VAT; paid revenue on payment date." Removed from the rail: Client/Order/Invoice ID, IP, Company, Domain, Client Group, Country, Service Status.

**Tooltip mapping:**

| Hovering on | Tooltip page |
| --- | --- |
| Category, product, TLD, customer, channel, source and payment-method charts | TT - Category: paid R, orders, AOV, unpaid + top 5 products |
| Daily, weekday and weekly charts; the Daily Sales table | TT - Period (renamed from TT - Week): same KPIs + revenue by category |
| Products matrix | Revenue Tooltip (fixed to use measures) |

## Fixes to known report issues (documentation §11)

| Issue | Fix in the redesign copy |
| --- | --- |
| Revenue Tooltip used implicit Sum(invoice\_total) / Count(order\_id) | Now \[Paid Revenue (Products)\], \[Paid Orders (Products)\], % of total |
| Relative date slicer headed "Product Category" | One slicer, headed "Period" |
| "Billling Cycle" typo and duplicate slicers | One slicer per field, fixed order |
| All slicers named "Date" in the Selection pane | Each named after its header |
| Duplicate invoice\_total > 0 page filter, empty Status\_Group filter | Removed; the measures already exclude R0 and unpaid rows |
| Empty Data\_Exploration matrix | Page dropped; Daily Sales replaces it |
| Date slicers unsynced, default Last 1 Days | All rail slicers synced; Period defaults to Last 30 days |
| Inconsistent tooltip pages | One mapping (above) |
| Unpaid and cancelled shown as one number | Split. The split filters Status\_Filter, because the base measure overrides any filter on invoice\_status. |
| "New" and "Existing" cards identical to Paid | Replaced by the New-customer share KPI and new-vs-existing visuals |
| Category bars ≠ Paid card (R532K vs R518.6K) | Cards no longer carry the extra orders\_invoices\_tbl status filter, so they use the same filter context as the charts |
| Unused custom visuals packaged | Removed from the copy |

## Verification and reconciliation

The brief's test figure reconciles, but on a different basis from what the report now shows. Click-through checks are still to do in Power BI.

| Check | Result |
| --- | --- |
| Brief: 1–29 Sep 2026, 588 paid orders, R143,924.45 | **Confirmed** against the uploaded WHMCS extract (`paid_orders_(01:09)-(29:09).csv`): 588 orders, R143,924.45 exactly. That is **incl. VAT, by order date**. |
| Same orders excl. VAT (order date) | ≈ **R125,152** (÷ 1.15). Check in Power BI with \[Paid Orders\] and \[Paid Invoice Revenue\] over 1‒9 Sep; the exact value uses invoice subtotals. |
| What the cards show (excl. VAT, **paid date**) | A different number by design: August orders paid in September are included, September orders paid in October are not. Of September's own orders, 573 were paid 1–29 Sep (R141,397.52 incl. VAT, ≈ R122,954 excl.). Record the Power BI value as the new baseline. |
| Generated report files | Schema-valid against Microsoft's PBIR schemas (one pre-existing bookmark warning from a newer property) |
| Category totals = Paid card | Holds by construction (same measure, no extra card filters). **Still to confirm in Power BI.** |
| Slicer click-through on each page | **Not run.** No browser or Desktop in this session. Checklist in spec §7.2. |

DAX query to run once the report is open (DAX query view, read-only):

```
EVALUATE
CALCULATETABLE (
    ROW ( "Paid Orders", [Paid Orders], "Paid Invoice Revenue", [Paid Invoice Revenue],
          "Paid Revenue (Products)", [Paid Revenue (Products)], "Paid Orders (Products)", [Paid Orders (Products)] ),
    DATESBETWEEN ( 'Calendar'[Date (format)], DATE ( 2026, 9, 1 ), DATE ( 2026, 9, 29 ) )
)
```
