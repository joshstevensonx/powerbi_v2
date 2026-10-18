# Power Query / model changes for the incremental GA4 tables (draft)

Only the **SQL text** in the two BigQuery partitions changes. The views return the same column names, types and grain as today, so the following stay untouched:
- the relationships (`Sessions[date]` → Calendar, the hidden upi + date key, the inactive `GA_INVOICES[invoice_date]` link)
- the lookup columns on `orders_invoices_tbl` / `revenue_orders_tbl` (GA Source, gads_campaign, Session …)
- `Visit Ads Campaign`, `Visit GA Source` and the report measures

## Change

In each partition, keep the existing `Source` / navigation steps and every step after the native query (types, renames, the hidden key). Replace only the SQL string passed to `Value.NativeQuery`:

| Model table | New SQL |
|---|---|
| `Sessions` | ``SELECT * FROM `grid-bq-project.daily_sales_ga4.v_ga_sessions` `` |
| `GA_INVOICES` | ``SELECT * FROM `grid-bq-project.daily_sales_ga4.v_ga_invoice` `` |

If the partition uses the usual pattern, it ends up like this (check against the real partition, don't paste blind):

```m
let
    Source = GoogleBigQuery.Database([BillingProject = "grid-bq-project"]),
    GA = Value.NativeQuery(
        Source{[Name = "grid-bq-project"]}[Data],
        "SELECT * FROM `grid-bq-project.daily_sales_ga4.v_ga_sessions`",
        null,
        [EnableFolding = true]
    )
    // …existing type / key steps unchanged…
in
    GA
```

## How to apply (same route as the 18 Oct Bing change, §6.5)
1. Save a fresh metadata backup of the model (as on 18 Oct), because the model is shared by v2.0 and v3.0.
2. Apply the two partition edits via Fabric updateDefinition (TMDL), **outside** the scheduled refresh windows (~:03–:17 and ~:31–:45).
3. Refresh the model, then run these DAX checks against the numbers from before the switch:
   - `EVALUATE ROW("sess", COUNTROWS(Sessions), "inv", COUNTROWS(GA_INVOICES), "gads", CALCULATE(COUNTROWS(GA_INVOICES), GA_INVOICES[is_gads]))`. On 18 Oct this was ~27,315 invoices, ~1,448 Ads; it should now be the same or a little higher.
   - `EVALUATE SUMMARIZECOLUMNS(orders_invoices_tbl[GA Source], "n", COUNTROWS(orders_invoices_tbl))`. Should be unchanged except for today.
   - Website page, 17–18 Oct: visits ~1,084, invoice views ~88, web paid orders 9, R 889.
4. Watch BigQuery bytes billed for the next refreshes (Job history, filter by the Power BI user).
