window.__NEWCOL = {
  OI_GA: `
		VAR _inv = orders_invoices_tbl[order_invoiceid]
		VAR _seen = LOOKUPVALUE ( GA_INVOICES[invoice_id], GA_INVOICES[invoice_id], _inv )
		VAR _ads = LOOKUPVALUE ( GA_INVOICES[is_gads], GA_INVOICES[invoice_id], _inv )
		VAR _key = LOOKUPVALUE ( GA_INVOICES[upi_date], GA_INVOICES[invoice_id], _inv )
		VAR _src = IF ( NOT ISBLANK ( _key ), LOWER ( TRIM ( LOOKUPVALUE ( Sessions[traffic_source], Sessions[upi_date], _key ) ) ) )
		VAR _med = IF ( NOT ISBLANK ( _key ), LOWER ( TRIM ( LOOKUPVALUE ( Sessions[traffic_medium], Sessions[upi_date], _key ) ) ) )
		RETURN SWITCH ( TRUE (), ISBLANK ( _seen ), "Not seen in GA", _ads = TRUE (), "Google Ads", _src = "bing" && _med = "cpc", "Bing Ads", "Other" )`,
  OI_CAMP: `
		VAR _inv = orders_invoices_tbl[order_invoiceid]
		VAR _seen = LOOKUPVALUE ( GA_INVOICES[invoice_id], GA_INVOICES[invoice_id], _inv )
		VAR _camp = LOOKUPVALUE ( GA_INVOICES[campaign_name], GA_INVOICES[invoice_id], _inv )
		VAR _key = LOOKUPVALUE ( GA_INVOICES[upi_date], GA_INVOICES[invoice_id], _inv )
		VAR _src = IF ( NOT ISBLANK ( _key ), LOWER ( TRIM ( LOOKUPVALUE ( Sessions[traffic_source], Sessions[upi_date], _key ) ) ) )
		VAR _med = IF ( NOT ISBLANK ( _key ), LOWER ( TRIM ( LOOKUPVALUE ( Sessions[traffic_medium], Sessions[upi_date], _key ) ) ) )
		VAR _utm = IF ( NOT ISBLANK ( _key ), COALESCE ( TRIM ( LOOKUPVALUE ( Sessions[utm_campaign], Sessions[upi_date], _key ) ), "" ) )
		RETURN SWITCH ( TRUE (),
		    ISBLANK ( _seen ), "Not seen in GA",
		    NOT ISBLANK ( _camp ) && _camp <> "", _camp,
		    _src = "bing" && _med = "cpc", "Bing – " & IF ( _utm = "" || LOWER ( _utm ) IN { "(organic)", "(not set)", "(direct)" }, "not tagged", _utm ),
		    "No ad campaign" )`,
  S_CAMP: `
		VAR _raw = COALESCE ( TRIM ( Sessions[gads_campaign] ), "" )
		VAR _src = LOWER ( TRIM ( Sessions[traffic_source] ) )
		VAR _med = LOWER ( TRIM ( Sessions[traffic_medium] ) )
		VAR _utm = COALESCE ( TRIM ( Sessions[utm_campaign] ), "" )
		RETURN SWITCH ( TRUE (),
		    _raw <> "" && _raw <> "-", _raw,
		    _src = "bing" && _med = "cpc", "Bing – " & IF ( _utm = "" || LOWER ( _utm ) IN { "(organic)", "(not set)", "(direct)" }, "not tagged", _utm ),
		    "No ad campaign" )`,
  S_GA: `
		VAR _raw = COALESCE ( TRIM ( Sessions[gads_campaign] ), "" )
		VAR _src = LOWER ( TRIM ( Sessions[traffic_source] ) )
		VAR _med = LOWER ( TRIM ( Sessions[traffic_medium] ) )
		RETURN SWITCH ( TRUE (), _raw <> "" && _raw <> "-", "Google Ads", _src = "bing" && _med = "cpc", "Bing Ads", "Other" )`
};
const N = window.__NEWCOL; const flat = s => s.replace(/\s+/g, ' ');
const D = `DATESBETWEEN('Calendar'[Date (format)], DATE(2026,6,18), DATE(2026,10,18))`;
const defs = `DEFINE
COLUMN orders_invoices_tbl[GA Source NEW] = ${flat(N.OI_GA)}
COLUMN orders_invoices_tbl[Campaign NEW] = ${flat(N.OI_CAMP)}
COLUMN Sessions[Camp NEW] = ${flat(N.S_CAMP)}
COLUMN Sessions[GA NEW] = ${flat(N.S_GA)}
`;
const out = [];
out.push(await window.__qq(defs + `EVALUATE SUMMARIZECOLUMNS(orders_invoices_tbl[GA Source NEW], orders_invoices_tbl[Campaign NEW], ${D}, "orders", COUNTROWS(orders_invoices_tbl))`));
out.push(await window.__qq(defs + `EVALUATE SUMMARIZECOLUMNS(Sessions[GA NEW], Sessions[Camp NEW], ${D}, "visits", COUNTROWS(Sessions))`));
window.__show(out.join('\n=====\n'));
