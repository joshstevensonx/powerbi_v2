-- 03_procedures.sql — DRAFT, not deployed. Idempotent loaders: each call REPLACES the window's partitions,
-- so re-running a day (or the whole backfill) never duplicates rows. Each runs in one transaction.

CREATE OR REPLACE PROCEDURE `grid-bq-project.daily_sales_ga4.load_sessions`(win_start DATE, win_end DATE)
BEGIN
  BEGIN TRANSACTION;
  DELETE FROM `grid-bq-project.daily_sales_ga4.ga_sessions_daily`
  WHERE date BETWEEN win_start AND win_end;
  INSERT INTO `grid-bq-project.daily_sales_ga4.ga_sessions_daily`
    (upi, uid, date, sid, session_start, browser, platform, device_type, device_os, country, city,
     traffic_category, utm_campaign, traffic_source, traffic_medium, gads_campaign)
  SELECT
    upi, uid, date, sid, session_start, browser, platform, device_type, device_os, country, city,
    traffic_category, utm_campaign, traffic_source, traffic_medium, gads_campaign
  FROM `grid-bq-project.daily_sales_ga4.tvf_sessions`(win_start, win_end);
  COMMIT TRANSACTION;
END;

-- An invoice is stored once, at its earliest view: rows already stored on an earlier date win; if the window
-- holds an earlier view than a row stored on a later date (out-of-order backfill), the later row is removed.
CREATE OR REPLACE PROCEDURE `grid-bq-project.daily_sales_ga4.load_invoices`(win_start DATE, win_end DATE)
BEGIN
  BEGIN TRANSACTION;
  DELETE FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`
  WHERE invoice_date BETWEEN win_start AND win_end;
  INSERT INTO `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`
    (invoice_id, invoice_date, upi, first_view_ts, campaign_name, is_gads)
  SELECT v.invoice_id, v.invoice_date, v.upi, v.first_view_ts, v.campaign_name, v.is_gads
  FROM `grid-bq-project.daily_sales_ga4.tvf_invoice_views`(win_start, win_end) AS v
  WHERE NOT EXISTS (
    SELECT 1 FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view` AS e
    WHERE e.invoice_id = v.invoice_id AND e.invoice_date < win_start
  );
  DELETE FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`
  WHERE invoice_date > win_end
    AND invoice_id IN (
      SELECT invoice_id FROM `grid-bq-project.daily_sales_ga4.ga_invoice_first_view`
      WHERE invoice_date BETWEEN win_start AND win_end
    );
  COMMIT TRANSACTION;
END;
