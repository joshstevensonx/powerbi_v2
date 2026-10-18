-- 05_backfill_and_schedule.sql — DRAFT, not deployed.

-- ── A. One-time backfill (run by hand in the console, after 01–04) ──────────────────────────
-- Same scan as ONE of today's refreshes (GA4 data starts 18 Jun 2026; the original SQL starts at 1 Jan).
CALL `grid-bq-project.daily_sales_ga4.load_sessions`(DATE '2026-01-01', DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 1 DAY));
CALL `grid-bq-project.daily_sales_ga4.load_invoices`(DATE '2026-01-01', DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 1 DAY));

-- ── B. Daily scheduled query ───────────────────────────────────────────────────────────────────
-- BigQuery console → Scheduled queries → Create, paste ONLY the two CALL lines below.
--   Name: daily_sales_ga4 daily load · Repeats: daily · Start time: 08:15 UTC (10:15 SAST)
--   Destination: none (the procedures write the tables) · Location: <GA4_LOCATION>
--   Notifications: turn on "Send email notifications" for failures.
--   Service account / user: needs BigQuery Data Editor on daily_sales_ga4, Data Viewer on analytics_372327256, Job User.
-- It reloads the last 3 complete days (GA4 can still update a daily table for ~72 h), so a late export or a
-- failed run fixes itself the next day. If it fails for more than 3 days in a row, re-run section A
-- with the missing dates.
CALL `grid-bq-project.daily_sales_ga4.load_sessions`(DATE_SUB(@run_date, INTERVAL 3 DAY), DATE_SUB(@run_date, INTERVAL 1 DAY));
CALL `grid-bq-project.daily_sales_ga4.load_invoices`(DATE_SUB(@run_date, INTERVAL 3 DAY), DATE_SUB(@run_date, INTERVAL 1 DAY));
