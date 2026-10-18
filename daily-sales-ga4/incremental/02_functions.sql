-- 02_functions.sql — DRAFT, not deployed. Table functions = the single copy of the GA4 logic.
-- Both the daily load (03) and the "today" tail in the views (04) call these, so the logic can't drift.
-- Each reads only the daily + intraday export tables from win_start−1 to win_end+1
-- (±1 day so sessions that cross midnight get the right start date and attributes).

-- ─────────────────────────────────────────────────────────────────────────────
-- Sessions. ⚠ RECONSTRUCTED from the column spec in Daily_Sales_v2_Documentation §5.10 — the original
-- Sessions SQL is not in the repo. Before deploying, open the model's Sessions query (Power Query) and copy its
-- event-level expressions into the `events` CTE below, so the columns are computed exactly as today.
-- Then run 06_validate.sql.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE FUNCTION `grid-bq-project.daily_sales_ga4.tvf_sessions`(win_start DATE, win_end DATE) AS (
  WITH
    events AS (
      SELECT
        user_pseudo_id AS upi,
        user_id,
        PARSE_DATE('%Y%m%d', event_date) AS dt,
        event_timestamp AS ts,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS sid,
        device.web_info.browser AS browser,
        platform,
        device.category AS device_type,
        device.operating_system AS device_os,
        geo.country AS country,
        geo.city AS city,
        session_traffic_source_last_click.cross_channel_campaign.default_channel_group AS traffic_category,
        session_traffic_source_last_click.manual_campaign.campaign_name AS utm_campaign,
        session_traffic_source_last_click.manual_campaign.source AS traffic_source,
        session_traffic_source_last_click.manual_campaign.medium AS traffic_medium,
        session_traffic_source_last_click.google_ads_campaign.campaign_name AS gads_campaign
      FROM `grid-bq-project.analytics_372327256.events_*`
      WHERE
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(win_start, INTERVAL 1 DAY))
                          AND FORMAT_DATE('%Y%m%d', DATE_ADD(win_end, INTERVAL 1 DAY))
        OR _TABLE_SUFFIX BETWEEN CONCAT('intraday_', FORMAT_DATE('%Y%m%d', DATE_SUB(win_start, INTERVAL 1 DAY)))
                             AND CONCAT('intraday_', FORMAT_DATE('%Y%m%d', DATE_ADD(win_end, INTERVAL 1 DAY)))
    ),
    sessions AS (
      SELECT
        upi,
        sid,
        MIN(dt) AS dt,                                   -- midnight-safe start date
        MIN(ts) AS start_ts,
        MAX(user_id) AS uid,
        -- last observed values in the session
        ARRAY_AGG(browser IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS browser,
        ARRAY_AGG(platform IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS platform,
        ARRAY_AGG(device_type IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS device_type,
        ARRAY_AGG(device_os IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS device_os,
        ARRAY_AGG(country IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS country,
        ARRAY_AGG(city IGNORE NULLS ORDER BY ts DESC LIMIT 1)[SAFE_OFFSET(0)] AS city,
        -- traffic columns from the first event in the session that carries attribution
        ARRAY_AGG(
          IF(traffic_category IS NULL, NULL, STRUCT(traffic_category, utm_campaign, traffic_source, traffic_medium))
          IGNORE NULLS ORDER BY ts LIMIT 1)[SAFE_OFFSET(0)] AS attr,
        -- first non-NULL Google Ads campaign in the session (same rule as ga_invoice_fixed.sql)
        ARRAY_AGG(gads_campaign IGNORE NULLS ORDER BY ts LIMIT 1)[SAFE_OFFSET(0)] AS gads_campaign
      FROM events
      WHERE sid IS NOT NULL
      GROUP BY upi, sid
    )
  SELECT
    upi,
    MAX(uid) OVER (PARTITION BY upi) AS uid,             -- resolved across the user's sessions in the window
    dt AS date,
    sid,
    TIMESTAMP_MICROS(start_ts) AS session_start,
    browser, platform, device_type, device_os, country, city,
    attr.traffic_category, attr.utm_campaign, attr.traffic_source, attr.traffic_medium,
    COALESCE(gads_campaign, '-') AS gads_campaign
  FROM sessions
  WHERE dt BETWEEN win_start AND win_end
  QUALIFY ROW_NUMBER() OVER (PARTITION BY upi, dt ORDER BY start_ts, sid) = 1
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Invoice first views: ga_invoice_fixed.sql (live in the model) limited to a window. Logic unchanged;
-- only the _TABLE_SUFFIX filter and the window filter on the view date are new, plus first_view_ts.
-- "First view" here means first within the window; load_invoices / v_ga_invoice drop invoices already seen earlier.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE FUNCTION `grid-bq-project.daily_sales_ga4.tvf_invoice_views`(win_start DATE, win_end DATE) AS (
  WITH
    events AS (
      SELECT
        user_pseudo_id AS upi,
        PARSE_DATE('%Y%m%d', event_date) AS dt,
        event_timestamp,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS sid,
        session_traffic_source_last_click.google_ads_campaign.campaign_name AS gads_campaign
      FROM `grid-bq-project.analytics_372327256.events_*`
      WHERE
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(win_start, INTERVAL 1 DAY))
                          AND FORMAT_DATE('%Y%m%d', DATE_ADD(win_end, INTERVAL 1 DAY))
        OR _TABLE_SUFFIX BETWEEN CONCAT('intraday_', FORMAT_DATE('%Y%m%d', DATE_SUB(win_start, INTERVAL 1 DAY)))
                             AND CONCAT('intraday_', FORMAT_DATE('%Y%m%d', DATE_ADD(win_end, INTERVAL 1 DAY)))
    ),
    invoice_views AS (
      SELECT
        SAFE_CAST(REGEXP_EXTRACT(page_location, r'/client/viewinvoice\.php\?(?:[^#]*&)?id=(\d+)') AS INT64) AS invoice_id,
        upi, dt, event_timestamp
      FROM events
      WHERE page_location LIKE '%/client/viewinvoice.php%'
        AND dt BETWEEN win_start AND win_end
    ),
    first_view AS (   -- one row per invoice: its earliest view in the window
      SELECT * FROM invoice_views
      WHERE invoice_id IS NOT NULL
      QUALIFY ROW_NUMBER() OVER (PARTITION BY invoice_id ORDER BY event_timestamp) = 1
    ),
    sessions AS (
      SELECT
        upi, sid,
        MIN(dt) AS dt,
        MIN(event_timestamp) AS start_ts,
        ARRAY_AGG(gads_campaign IGNORE NULLS ORDER BY event_timestamp LIMIT 1)[SAFE_OFFSET(0)] AS gads_campaign
      FROM events
      WHERE sid IS NOT NULL
      GROUP BY upi, sid
    ),
    first_session AS (   -- same rule as the sessions table
      SELECT upi, dt, gads_campaign
      FROM sessions
      WHERE TRUE
      QUALIFY ROW_NUMBER() OVER (PARTITION BY upi, dt ORDER BY start_ts, sid) = 1
    )
  SELECT
    v.invoice_id,
    v.dt AS invoice_date,
    v.upi,
    v.event_timestamp AS first_view_ts,
    fs.gads_campaign AS campaign_name,
    fs.gads_campaign IS NOT NULL AS is_gads
  FROM first_view v
  LEFT JOIN first_session fs ON fs.upi = v.upi AND fs.dt = v.dt
);
