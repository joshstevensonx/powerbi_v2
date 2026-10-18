-- 01_tables.sql — DRAFT, not deployed. Run once in the BigQuery console (project grid-bq-project).
-- Creates the dataset and the two partitioned tables that the daily scheduled query fills.
-- ⚠ Set location to the SAME location as analytics_372327256 (BigQuery console → dataset → Details → Data location),
--   otherwise queries that read the GA4 export from this dataset fail. Replace <GA4_LOCATION> (e.g. US, EU, africa-south1).

CREATE SCHEMA IF NOT EXISTS `grid-bq-project.daily_sales_ga4`
OPTIONS (
  location = '<GA4_LOCATION>',
  description = 'Daily Sales Power BI: incremental GA4 tables (Sessions, GA_INVOICES). Filled by the scheduled query "daily_sales_ga4 daily load".'
);

-- Sessions: one row per upi per date = that user's first session of the day (same grain as the model's Sessions table).
CREATE TABLE IF NOT EXISTS `grid-bq-project.daily_sales_ga4.ga_sessions_daily` (
  upi STRING,                -- GA4 user_pseudo_id
  uid STRING,                -- GA4 user_id, MAX within the load window (the view re-resolves it across all days)
  date DATE,                 -- date the session started (MIN event_date in the session)
  sid INT64,                 -- ga_session_id
  session_start TIMESTAMP,   -- first event of the session  ⚠ check type against the model's Sessions[session_start]
  browser STRING,
  platform STRING,
  device_type STRING,
  device_os STRING,
  country STRING,
  city STRING,
  traffic_category STRING,   -- default channel group (session last click)
  utm_campaign STRING,
  traffic_source STRING,
  traffic_medium STRING,
  gads_campaign STRING       -- '-' when not Google Ads (same convention as today)
)
PARTITION BY date
CLUSTER BY upi
OPTIONS (description = 'First GA4 session per user per day. Loaded by load_sessions(win_start, win_end).');

-- GA_INVOICES: one row per WHMCS invoice id at its earliest view on /client/viewinvoice.php.
CREATE TABLE IF NOT EXISTS `grid-bq-project.daily_sales_ga4.ga_invoice_first_view` (
  invoice_id INT64,          -- tblinvoices.id
  invoice_date DATE,         -- date of the FIRST view (not invoice or paid date)
  upi STRING,                -- user who first viewed it
  first_view_ts INT64,       -- event_timestamp (µs) of the first view; keeps "earliest view wins" deterministic
  campaign_name STRING,      -- Google Ads campaign of that user's first session on the view date, else NULL
  is_gads BOOL
)
PARTITION BY invoice_date
CLUSTER BY invoice_id
OPTIONS (description = 'First view per invoice with first-session Google Ads campaign. Loaded by load_invoices(win_start, win_end).');
