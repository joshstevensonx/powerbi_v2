-- 06_validate.sql — run after the backfill, BEFORE changing Power BI. Each query should return 0 rows.

-- 1. GA_INVOICES: new view vs the SQL live in the model today (ga_invoice_fixed.sql), both directions.
--    Paste ga_invoice_fixed.sql (without a trailing semicolon) into `old`. Compare only up to yesterday,
--    because today's intraday data moves between the two runs.
WITH
  old AS (
    -- ← paste ga_invoice_fixed.sql here
    SELECT CAST(NULL AS INT64) AS invoice_id, CAST(NULL AS DATE) AS invoice_date, CAST(NULL AS STRING) AS upi,
           CAST(NULL AS STRING) AS campaign_name, CAST(NULL AS BOOL) AS is_gads
    FROM UNNEST([1]) WHERE FALSE
  ),
  new AS (SELECT invoice_id, invoice_date, upi, campaign_name, is_gads FROM `grid-bq-project.daily_sales_ga4.v_ga_invoice`),
  y AS (SELECT DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 1 DAY) AS d)
SELECT 'only in old' AS side, * FROM (SELECT * FROM old WHERE invoice_date <= (SELECT d FROM y)
                                       EXCEPT DISTINCT SELECT * FROM new WHERE invoice_date <= (SELECT d FROM y))
UNION ALL
SELECT 'only in new', * FROM (SELECT * FROM new WHERE invoice_date <= (SELECT d FROM y)
                               EXCEPT DISTINCT SELECT * FROM old WHERE invoice_date <= (SELECT d FROM y));

-- 2. GA_INVOICES: still one row per invoice.
SELECT invoice_id, COUNT(*) AS n FROM `grid-bq-project.daily_sales_ga4.v_ga_invoice` GROUP BY invoice_id HAVING n > 1;

-- 3. Sessions: still one row per upi + date (the model's hidden upi+date key relies on it).
SELECT upi, date, COUNT(*) AS n FROM `grid-bq-project.daily_sales_ga4.v_ga_sessions` GROUP BY upi, date HAVING n > 1;

-- 4. Sessions: new view vs the model's current Sessions SQL. Paste it into `old` the same way as in 1,
--    with the columns in this order. Differences here mean the reconstructed tvf_sessions expressions
--    (02_functions.sql) need to be aligned with the original.
WITH
  old AS (
    -- ← paste the model's Sessions SQL here
    SELECT CAST(NULL AS STRING) AS upi, CAST(NULL AS STRING) AS uid, CAST(NULL AS DATE) AS date, CAST(NULL AS INT64) AS sid,
           CAST(NULL AS TIMESTAMP) AS session_start, CAST(NULL AS STRING) AS browser, CAST(NULL AS STRING) AS platform,
           CAST(NULL AS STRING) AS device_type, CAST(NULL AS STRING) AS device_os, CAST(NULL AS STRING) AS country,
           CAST(NULL AS STRING) AS city, CAST(NULL AS STRING) AS traffic_category, CAST(NULL AS STRING) AS utm_campaign,
           CAST(NULL AS STRING) AS traffic_source, CAST(NULL AS STRING) AS traffic_medium, CAST(NULL AS STRING) AS gads_campaign
    FROM UNNEST([1]) WHERE FALSE
  ),
  new AS (
    SELECT upi, uid, date, sid, session_start, browser, platform, device_type, device_os, country, city,
           traffic_category, utm_campaign, traffic_source, traffic_medium, gads_campaign
    FROM `grid-bq-project.daily_sales_ga4.v_ga_sessions`
  ),
  y AS (SELECT DATE_SUB(CURRENT_DATE('Africa/Johannesburg'), INTERVAL 1 DAY) AS d)
SELECT 'only in old' AS side, COUNT(*) AS rows FROM (SELECT * FROM old WHERE date <= (SELECT d FROM y)
                                                      EXCEPT DISTINCT SELECT * FROM new WHERE date <= (SELECT d FROM y))
UNION ALL
SELECT 'only in new', COUNT(*) FROM (SELECT * FROM new WHERE date <= (SELECT d FROM y)
                                      EXCEPT DISTINCT SELECT * FROM old WHERE date <= (SELECT d FROM y));
-- (for query 4, 0 in both rows = identical)
