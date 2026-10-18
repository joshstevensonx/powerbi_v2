-- 04_views.sql — DRAFT, not deployed. What Power BI reads instead of the full-history SQL.
-- loaded rows (cheap: small partitioned tables) + a live "tail" for the days after the last load,
-- including today's intraday data, so the report stays as current as it is now.
-- The tail reads only the last 3 days + today from the GA4 export.
-- ⚠ After creating, dry-run `SELECT * FROM v_ga_sessions` in the console and check the bytes estimate is a few
--   days of GA4 data, not the whole export. If it isn't, the CURRENT_DATE() arguments aren't pruning
--   _TABLE_SUFFIX; then inline the tail with literal DATE_SUB(CURRENT_DATE(...)) filters instead of the TVF.

CREATE OR REPLACE VIEW `grid-bq-project.daily_sales_ga4.v_ga_sessions`
OPTIONS (description = 'Power BI Sessions source: ga_sessions_daily + live tail since the last load.')
AS
WITH
  loaded AS (
    SELECT * FROM `grid-bq-project.daily_sales_ga4.ga_sessions_daily`
  ),
  tail AS (
    SELECT *
    FROM `grid-bq-project.daily_sales_ga4.tvf_sessions`(
      DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 3 DAY), CURRENT_DATE('Africa/Johannesburg'))
    WHERE date > (SELECT IFNULL(MAX(date), DATE '2025-12-31') FROM `grid-bq-project.daily_sales_ga4.ga_sessions_daily`)
  ),
  u AS (
    SELECT * FROM loaded
    UNION ALL
    SELECT * FROM tail
  )
SELECT
  upi,
  MAX(uid) OVER (PARTITION BY upi) AS uid,               -- user_id resolved across all of the user's days
  date, sid, session_start, browser, platform, device_type, device_os, country, city,
  traffic_category, utm_campaign, traffic_source, traffic_medium, gads_campaign
FROM u;

CREATE OR REPLACE VIEW `grid-bq-project.daily_sales_ga4.v_ga_invoice`
OPTIONS (description = 'Power BI GA_INVOICES source: ga_invoice_first_view + live tail; one row per invoice.')
AS
WITH
  loaded AS (
    SELECT invoice_id, invoice_date, upi, campaign_name, is_gads
    FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`
  ),
  tail AS (
    SELECT v.invoice_id, v.invoice_date, v.upi, v.campaign_name, v.is_gads
    FROM `grid-bq-project.daily_sales_ga4.tvf_invoice_views`(
      DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 3 DAY), CURRENT_DATE('Africa/Johannesburg')) AS v
    WHERE v.invoice_date > (SELECT IFNULL(MAX(invoice_date), DATE '2025-12-31') FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`)
      AND v.invoice_id NOT IN (SELECT invoice_id FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`)
  )
SELECT * FROM loaded
UNION ALL
SELECT * FROM tail;
