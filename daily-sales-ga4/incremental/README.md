# GA4 incremental load: draft (not deployed)

**Problem (handover §1 item 4):** `GA_INVOICES` and `Sessions` each re-scan every GA4 event since 2026-01-01 on every model refresh. The model refreshes about twice an hour, so that's ~96 full scans a day, and each scan grows daily.

**Proposal:** a daily BigQuery scheduled query appends the last complete days to two small partitioned tables. Power BI then reads two views: the stored rows plus a "tail" of the last 3 days and today's intraday data. Each refresh scans only a few days of GA4 events plus the small tables, and the report stays as current as it is today.

Status: **drafted offline on 18 Oct 2026. Not run against BigQuery** (this session had no BigQuery access), so syntax and pruning still need a check in the console. Nothing is deployed and the model is unchanged.

| File | What it does | Run |
|---|---|---|
| `01_tables.sql` | Dataset `daily_sales_ga4` plus partitioned tables `ga_sessions_daily` (by date, clustered by upi) and `ga_invoice_first_view` (by invoice_date, clustered by invoice_id). **Set `<GA4_LOCATION>`** to the location of the GA4 export dataset first. | once |
| `02_functions.sql` | Table functions `tvf_sessions(start, end)` and `tvf_invoice_views(start, end)`. They hold the only copy of the logic, and each reads export tables from start−1 to end+1 only. `tvf_invoice_views` is `ga_invoice_fixed.sql` with a window. ⚠ `tvf_sessions` is **rebuilt from the column spec**, because the original Sessions SQL isn't in the repo. Copy the model's Sessions expressions into it before deploying. | once |
| `03_procedures.sql` | `load_sessions` / `load_invoices`: in one transaction, delete the window's partitions and insert them again. This makes them idempotent, so a re-run never duplicates rows. Invoices keep their earliest view across all loads. | via 05 |
| `04_views.sql` | `v_ga_sessions` / `v_ga_invoice`: stored rows plus the live tail. `uid` is resolved across all days, as it is today. | once |
| `05_backfill_and_schedule.sql` | A: one-time backfill (costs about one current refresh). B: the two `CALL` lines for the daily scheduled query (08:15 UTC, reloads the last 3 days because GA4 can update a daily table for up to 72 h). | A once, B scheduled |
| `06_validate.sql` | Old vs new comparison (EXCEPT DISTINCT both ways, up to yesterday) plus grain checks. All results should be empty. | before switching Power BI |
| `powerquery.md` | Model changes: only the SQL text in the two partitions changes. | after 06 is clean |

**Order:** 01 → 02 → 03 → 04 → 05A → 06 (fix `tvf_sessions` until query 4 shows 0 / 0) → dry-run both views and check the bytes estimate → 05B → `powerquery.md` → refresh, then run the DAX checks.

**Rollback:** put the old SQL back in the two Power Query partitions. The BigQuery tables, views and schedule can stay (they're unused) or be dropped.

**Things to confirm in BigQuery:**
- The dataset location matches the GA4 export.
- The `CURRENT_DATE()` arguments in the views prune `_TABLE_SUFFIX` (check the dry-run bytes).
- The type of `Sessions[session_start]` in the model matches (TIMESTAMP here).
- The Power BI BigQuery credential can read `daily_sales_ga4` (Data Viewer). The views read the GA4 dataset too, so it needs read access there as well, which it already has.
