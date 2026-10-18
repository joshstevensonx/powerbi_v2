-- ga_invoice (reviewed 18 Oct 2026)
-- One row per WHMCS invoice first viewed on /client/viewinvoice.php, with the
-- Google Ads campaign of that user's first session on the view date.
-- First session uses the same rule as the `sessions` table (ga_session_id,
-- earliest start, first event in the session that carries attribution).
WITH
  events AS (
    SELECT
      user_pseudo_id AS upi,
      PARSE_DATE('%Y%m%d', event_date) AS dt,
      event_timestamp,
      (
        SELECT value.string_value
        FROM UNNEST(event_params)
        WHERE key = 'page_location'
      ) AS page_location,
      (
        SELECT value.int_value
        FROM UNNEST(event_params)
        WHERE key = 'ga_session_id'
      ) AS sid,
      session_traffic_source_last_click.google_ads_campaign.campaign_name
        AS gads_campaign
    FROM `grid-bq-project.analytics_372327256.events_*`
    WHERE
      _TABLE_SUFFIX
        BETWEEN '20260101'
        AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      OR _TABLE_SUFFIX LIKE 'intraday_%'
  ),
  invoice_views AS (
    SELECT
      SAFE_CAST(
        REGEXP_EXTRACT(
          page_location,
          r'/client/viewinvoice\.php\?(?:[^#]*&)?id=(\d+)')
        AS INT64) AS invoice_id,
      upi,
      dt,
      event_timestamp
    FROM events
    WHERE page_location LIKE '%/client/viewinvoice.php%'
  ),
  -- one row per invoice: its earliest view (several users/devices can open one invoice)
  first_view AS (
    SELECT *
    FROM invoice_views
    WHERE invoice_id IS NOT NULL
    QUALIFY
      ROW_NUMBER() OVER (PARTITION BY invoice_id ORDER BY event_timestamp) = 1
  ),
  sessions AS (
    SELECT
      upi,
      sid,
      MIN(dt) AS dt,
      MIN(event_timestamp) AS start_ts,
      -- earliest event in the session that carries a Google Ads campaign
      ARRAY_AGG(gads_campaign IGNORE NULLS ORDER BY event_timestamp LIMIT 1)[
        SAFE_OFFSET(0)] AS gads_campaign
    FROM events
    WHERE sid IS NOT NULL
    GROUP BY upi, sid
  ),
  first_session AS (
    SELECT upi, dt, gads_campaign
    FROM sessions
    WHERE TRUE
    QUALIFY ROW_NUMBER() OVER (PARTITION BY upi, dt ORDER BY start_ts, sid) = 1
  )
SELECT
  v.invoice_id,
  v.dt AS invoice_date,
  v.upi,
  fs.gads_campaign AS campaign_name,
  fs.gads_campaign IS NOT NULL AS is_gads
FROM first_view v
LEFT JOIN first_session fs
  ON fs.upi = v.upi AND fs.dt = v.dt
