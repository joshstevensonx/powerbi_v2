// ===== Build Website page + 3 deep-dive pages into the copy (window.__parts) =====
await window.__ensureDef();
const parts = window.__parts.map(p => ({ path: p.path, payload: p.payload, payloadType: p.payloadType }));
const dec = window.__dec, enc = window.__enc;
const getJ = path => JSON.parse(dec(parts.find(p => p.path === path).payload));
const setJ = (path, obj) => { const s = JSON.stringify(obj, null, 2); const i = parts.findIndex(p => p.path === path); if (i >= 0) parts[i].payload = enc(s); else parts.push({ path, payload: enc(s), payloadType: 'InlineBase64' }); };
const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n / 2))).map(b => b.toString(16).padStart(2, '0')).join('');
const L = v => ({ expr: { Literal: { Value: v } } });
const S = v => L("'" + String(v).replace(/'/g, "''") + "'");
const clone = o => JSON.parse(JSON.stringify(o));

const WEB = '9a1081841dbc4a123275';
const VP = pid => `definition/pages/${pid}/visuals/`;
const tpl = {
  card: getJ(VP(WEB) + 'a1fdcb0b91fb86944383/visual.json'),
  bar: getJ(VP(WEB) + '56bc32687fe9260685da/visual.json'),
  combo: getJ(VP('0763325084da6ba73a4a') + '9dc18f37be8e302a678f/visual.json'),
  pie: getJ(VP('0763325084da6ba73a4a') + '3216d5a7ac672f6109c6/visual.json'),
  table: getJ(VP('42ff0aac594b28e471d9') + '9b5c8ca1984012c486b2/visual.json'),
  note: getJ(VP(WEB) + 'c9af3a7ca3218bd9c1ce/visual.json'),
  button: getJ(VP(WEB) + 'c591704bc7adebdc4c1b/visual.json'),
};

// ---------- measures (report-level, revenue_orders_tbl) ----------
const ext = getJ('definition/reportExtensions.json');
const ent = ext.entities.find(e => e.name === 'revenue_orders_tbl');
const extNames = new Set(ent.measures.map(m => m.name));
const modelMeasures = { 'Paid Revenue (Products)': 'revenue_orders_tbl', 'Paid Orders (Products)': 'revenue_orders_tbl', 'Unpaid Revenue (Products)': 'revenue_orders_tbl', 'Unpaid Orders (Products)': 'revenue_orders_tbl', 'RO Invoice Total': 'revenue_orders_tbl', 'Paid Invoice Total': 'revenue_orders_tbl', 'GA Users': 'Sessions', 'GA Visitors': 'Sessions', 'Invoice Views': 'Sessions', 'GA Ads Users': 'Sessions' };
const CUR = '"R"\\ #,0;"R"\\ -#,0;"R"\\ #,0', INT = '#,0', PCT = '0.0%';
const OPEN = '{ "Unpaid", "Payment Pending", "Collections", "Draft" }';
const bridge = m => `CALCULATE ( ${m},
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Channel] ), NOT ISFILTERED ( revenue_orders_tbl[Session Channel] ) || Sessions[Visit Channel] IN FILTERS ( revenue_orders_tbl[Session Channel] ) ) ),
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Device] ), NOT ISFILTERED ( revenue_orders_tbl[Session Device] ) || Sessions[Visit Device] IN FILTERS ( revenue_orders_tbl[Session Device] ) ) ),
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Browser] ), NOT ISFILTERED ( revenue_orders_tbl[Session Browser] ) || Sessions[Visit Browser] IN FILTERS ( revenue_orders_tbl[Session Browser] ) ) ),
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Platform] ), NOT ISFILTERED ( revenue_orders_tbl[Session Platform] ) || Sessions[Visit Platform] IN FILTERS ( revenue_orders_tbl[Session Platform] ) ) ),
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Ads Campaign] ), NOT ISFILTERED ( revenue_orders_tbl[gads_campaign] ) || Sessions[Visit Ads Campaign] IN FILTERS ( revenue_orders_tbl[gads_campaign] ) ) ),
    KEEPFILTERS ( FILTER ( ALL ( Sessions[Visit Ads Campaign] ), NOT ISFILTERED ( revenue_orders_tbl[GA Source] )
        || ( Sessions[Visit Ads Campaign] <> "Not Google Ads" && "Google Ads" IN FILTERS ( revenue_orders_tbl[GA Source] ) )
        || ( Sessions[Visit Ads Campaign] = "Not Google Ads" && "Other" IN FILTERS ( revenue_orders_tbl[GA Source] ) ) ) )
)`;
const WEBF = 'KEEPFILTERS ( revenue_orders_tbl[GA Source] <> "Not seen in GA" )';
const byVisit = (m, sCol, rCol) => `CALCULATE ( ${m}, KEEPFILTERS ( TREATAS ( VALUES ( Sessions[${sCol}] ), revenue_orders_tbl[${rCol}] ) ) )`;
const M = [
  // Website: traffic, follows Channel/Device/Browser/Platform/Campaign/GA source slicers
  ['Web Visits', 'Website', INT, 'Double', bridge('[GA Users]'), 'GA4 visits: one per visitor per day (first session of the day). Follows the Channel, Device, Browser, Platform, Campaign and GA source filters.'],
  ['Web Unique Visitors', 'Website', INT, 'Double', bridge('[GA Visitors]'), 'Distinct GA4 visitors in the period. Same filters as Web Visits.'],
  ['Web Invoice Views', 'Website', INT, 'Double', bridge('[Invoice Views]'), 'WHMCS invoices first opened on the website in the period (view date).'],
  ['Web Invoice View Rate', 'Website', PCT, 'Double', 'DIVIDE ( [Web Invoice Views], [Web Visits] )', 'Invoice views ÷ visits.'],
  // Website: orders linked to a GA invoice view
  ['Paid Orders (Web)', 'Website', INT, 'Double', `CALCULATE ( [Paid Orders (Products)], ${WEBF} )`, 'Paid orders whose invoice was opened after a website visit (paid date).'],
  ['Paid Revenue (Web)', 'Website', CUR, 'Double', `CALCULATE ( [Paid Revenue (Products)], ${WEBF} )`, 'Paid revenue excl. VAT from orders whose invoice was opened after a website visit (paid date).'],
  ['Open Unpaid Revenue (Web)', 'Website', CUR, 'Double', `CALCULATE ( [Open Unpaid Revenue], ${WEBF} )`, 'Unpaid (collectable) invoice value excl. VAT, web-linked orders (order date).'],
  ['Open Unpaid Orders (Web)', 'Website', INT, 'Double', `CALCULATE ( [Open Unpaid Orders], ${WEBF} )`, 'Unpaid web-linked orders (order date).'],
  ['Cancelled Revenue (Web)', 'Website', CUR, 'Double', `CALCULATE ( [Cancelled Revenue], ${WEBF} )`, 'Cancelled invoice value excl. VAT, web-linked orders (order date).'],
  ['Cancelled Orders (Web)', 'Website', INT, 'Double', `CALCULATE ( [Cancelled Orders], ${WEBF} )`, 'Cancelled web-linked orders (order date).'],
  ['Web Share of Paid Revenue', 'Website', PCT, 'Double', 'DIVIDE ( [Paid Revenue (Web)], [Paid Revenue (Products)] )', 'Share of all paid revenue that came from web-linked orders.'],
  ['Visit to Paid Order Rate', 'Website', '0.00%', 'Double', 'DIVIDE ( [Paid Orders (Web)], [Web Visits] )', 'Web paid orders ÷ visits. Orders land on paid date, visits on visit date.'],
  ['KPI Web Share Caption', 'Website', null, 'Text', 'VAR _s = [Web Share of Paid Revenue] RETURN IF ( ISBLANK ( _s ), "No web-linked sales", FORMAT ( _s, "0%" ) & " of all paid revenue" )', 'Caption for the web revenue card.'],
  ['KPI View Rate Caption', 'Website', null, 'Text', 'VAR _r = [Web Invoice View Rate] RETURN IF ( ISBLANK ( _r ), "No visits", FORMAT ( _r, "0.0%" ) & " of visits opened an invoice" )', 'Caption for the invoice views card.'],
  // Website: order outcomes per Sessions row (used in tables grouped by Sessions columns)
  ['Paid Orders by Visit Channel', 'Website', INT, 'Double', byVisit('[Paid Orders (Web)]', 'Visit Channel', 'Session Channel'), 'Web paid orders matched to the visit channel row.'],
  ['Paid Revenue by Visit Channel', 'Website', CUR, 'Double', byVisit('[Paid Revenue (Web)]', 'Visit Channel', 'Session Channel'), 'Web paid revenue matched to the visit channel row.'],
  ['Unpaid Orders by Visit Channel', 'Website', INT, 'Double', byVisit('[Open Unpaid Orders (Web)]', 'Visit Channel', 'Session Channel'), 'Unpaid web orders matched to the visit channel row.'],
  ['Order Rate by Visit Channel', 'Website', '0.00%', 'Double', 'DIVIDE ( [Paid Orders by Visit Channel], [Web Visits] )', 'Paid orders ÷ visits for the channel.'],
  ['Paid Orders by Visit Campaign', 'Website', INT, 'Double', byVisit('[Paid Orders (Web)]', 'Visit Ads Campaign', 'gads_campaign'), 'Web paid orders matched to the Google Ads campaign row.'],
  ['Paid Revenue by Visit Campaign', 'Website', CUR, 'Double', byVisit('[Paid Revenue (Web)]', 'Visit Ads Campaign', 'gads_campaign'), 'Web paid revenue matched to the Google Ads campaign row.'],
  ['Paid Orders by Visit Device', 'Website', INT, 'Double', byVisit('[Paid Orders (Web)]', 'Visit Device', 'Session Device'), 'Web paid orders matched to the device row.'],
  // Deep dive: orders & invoices (order-date basis)
  ['Orders Placed', 'Deep dive', INT, 'Double', 'CALCULATE ( DISTINCTCOUNT ( revenue_orders_tbl[order_id] ), NOT ISBLANK ( revenue_orders_tbl[order_date] ) )', 'Distinct orders placed in the period (order date), any status.'],
  ['Paid Orders (Order Date)', 'Deep dive', INT, 'Double', 'CALCULATE ( DISTINCTCOUNT ( revenue_orders_tbl[order_id] ), KEEPFILTERS ( revenue_orders_tbl[invoice_status] = "Paid" ), revenue_orders_tbl[invoice_total] > 0, NOT ISBLANK ( revenue_orders_tbl[order_date] ) )', 'Orders placed in the period whose invoice is now paid.'],
  ['Order Value', 'Deep dive', CUR, 'Double', '[RO Invoice Total]', 'Invoice value excl. VAT, each invoice once, any status.'],
  ['Paid Value (Order Date)', 'Deep dive', CUR, 'Double', 'CALCULATE ( [RO Invoice Total], KEEPFILTERS ( revenue_orders_tbl[invoice_status] = "Paid" ) )', 'Paid invoice value excl. VAT for orders placed in the period.'],
  ['Products on Order', 'Deep dive', null, 'Text', 'CONCATENATEX ( VALUES ( revenue_orders_tbl[Product Name] ), revenue_orders_tbl[Product Name], ", ", revenue_orders_tbl[Product Name], ASC )', 'Products on the order(s) in context.'],
  ['Avg Days to Pay', 'Deep dive', '0.0', 'Double', 'AVERAGEX ( FILTER ( SUMMARIZE ( revenue_orders_tbl, revenue_orders_tbl[order_id], revenue_orders_tbl[order_date], revenue_orders_tbl[invoice_datepaid], revenue_orders_tbl[invoice_status] ), revenue_orders_tbl[invoice_status] = "Paid" && NOT ISBLANK ( revenue_orders_tbl[order_date] ) && revenue_orders_tbl[invoice_datepaid] >= revenue_orders_tbl[order_date] ), INT ( revenue_orders_tbl[invoice_datepaid] - revenue_orders_tbl[order_date] ) )', 'Average days from order to payment, paid orders placed in the period.'],
  ['Client Name', 'Deep dive', null, 'Text', 'VAR _c = SELECTEDVALUE ( revenue_orders_tbl[client_id] ) VAR _n = IF ( NOT ISBLANK ( _c ), LOOKUPVALUE ( Clients[companyname], Clients[client_id], _c ) ) RETURN IF ( ISBLANK ( _c ), BLANK (), IF ( LEN ( TRIM ( _n ) ) = 0, "(individual)", _n ) )', 'WHMCS company name for the client in context.'],
  // Deep dive: clients
  ['Clients Ordering', 'Deep dive', INT, 'Double', 'CALCULATE ( DISTINCTCOUNT ( revenue_orders_tbl[client_id] ), NOT ISBLANK ( revenue_orders_tbl[order_date] ) )', 'Distinct clients who placed an order in the period.'],
  ['Paying Clients', 'Deep dive', INT, 'Double', 'VAR _dates = VALUES ( \'Calendar\'[Date (format)] ) RETURN CALCULATE ( DISTINCTCOUNT ( revenue_orders_tbl[client_id] ), revenue_orders_tbl[invoice_status] = "Paid", revenue_orders_tbl[invoice_total] > 0, REMOVEFILTERS ( \'Calendar\' ), TREATAS ( _dates, revenue_orders_tbl[Revenue Date] ) )', 'Distinct clients with a paid order in the period (paid date).'],
  ['New Paying Clients', 'Deep dive', INT, 'Double', 'CALCULATE ( [Paying Clients], KEEPFILTERS ( revenue_orders_tbl[type_of_customer] = "New Customer" ) )', 'Paying clients who signed up on the order date.'],
  ['Revenue per Paying Client', 'Deep dive', CUR, 'Double', 'DIVIDE ( [Paid Revenue (Products)], [Paying Clients] )', 'Paid revenue excl. VAT ÷ paying clients.'],
  ['Clients with Open Invoices', 'Deep dive', INT, 'Double', `CALCULATE ( DISTINCTCOUNT ( revenue_orders_tbl[client_id] ), KEEPFILTERS ( revenue_orders_tbl[Status_Filter] IN ${OPEN} ), revenue_orders_tbl[invoice_total] > 0 )`, 'Clients with an unpaid (collectable) invoice on an order placed in the period.'],
  ['First Order Date', 'Deep dive', null, 'Text', 'VAR _d = MIN ( revenue_orders_tbl[order_date] ) RETURN IF ( ISBLANK ( _d ), BLANK (), FORMAT ( _d, "yyyy-mm-dd" ) )', 'First order date in context.'],
  ['Last Order Date', 'Deep dive', null, 'Text', 'VAR _d = MAX ( revenue_orders_tbl[order_date] ) RETURN IF ( ISBLANK ( _d ), BLANK (), FORMAT ( _d, "yyyy-mm-dd" ) )', 'Last order date in context.'],
];
const allNames = new Set([...extNames, ...M.map(m => m[0])]);
for (const [name, folder, fmt, dtype, expr, desc] of M) {
  if (extNames.has(name)) ent.measures = ent.measures.filter(m => m.name !== name);
  const refs = [];
  const seen = new Set();
  for (const mm of expr.matchAll(/\[([^\]]+)\]/g)) {
    const n = mm[1]; if (seen.has(n)) continue; seen.add(n);
    if (allNames.has(n)) refs.push({ entity: 'revenue_orders_tbl', name: n });
    else if (modelMeasures[n]) refs.push({ entity: modelMeasures[n], name: n });
  }
  const m = { name, dataType: dtype, expression: expr, displayFolder: folder, description: desc };
  if (fmt) m.formatString = fmt;
  if (refs.length) m.references = { measures: refs };
  ent.measures.push(m);
}
setJ('definition/reportExtensions.json', ext);
const isExt = n => allNames.has(n);

// ---------- field helpers ----------
const col = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const meas = (e, p) => isExt(p) && e === 'revenue_orders_tbl' ? { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: e } }, Property: p } } : { Measure: { Expression: { SourceRef: { Entity: e } }, Property: p } };
// f: 'c:Entity.Prop|Display' or 'm:Entity.Prop|Display'
const F = s => { const [k, rest] = s.split(':'); const [ep, disp] = rest.split('|'); const i = ep.indexOf('.'); const e = ep.slice(0, i), p = ep.slice(i + 1); const field = k === 'c' ? col(e, p) : meas(e, p); const pr = { field, queryRef: `${e}.${p}`, nativeQueryRef: disp || p }; if (disp) pr.displayName = disp; if (k === 'c') pr.active = true; return pr; };
const sortBy = (s, dir) => ({ sort: [{ field: F(s).field, direction: dir || 'Descending' }], isDefaultSort: true });
const notIn = (e, p, vals) => ({ name: hex(20), field: col(e, p), type: 'Categorical', filter: { Version: 2, From: [{ Name: 'x', Entity: e, Type: 0 }], Where: [{ Condition: { Not: { Expression: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'x' } }, Property: p } }], Values: vals.map(v => [{ Literal: { Value: "'" + v + "'" } }]) } } } } }] }, howCreated: 'User' });

let zc = 40000;
function base(t, x, y, w, h, title) {
  const v = clone(t); v.name = hex(20); zc += 10;
  v.position = { x, y, z: zc, height: h, width: w, tabOrder: zc };
  delete v.filterConfig;
  const vco = v.visual.visualContainerObjects || {};
  if (vco.title && title !== undefined) vco.title[0].properties.text = S(title);
  if (vco.visualTooltip) vco.visualTooltip = [{ properties: { show: L('true'), type: S('Default') } }];
  return v;
}
function card(x, y, w, h, title, m, opts) {
  const v = base(tpl.card, x, y, w, h, title);
  const prs = [F(m)];
  v.visual.query = { queryState: { Data: { projections: prs } } };
  if (opts && opts.caption) {
    // second line: caption measure shown as reference label is complex; use a subtitle via title? keep single value
  }
  return v;
}
function chart(type, t, x, y, w, h, title, cat, ys, opt) {
  const v = base(t, x, y, w, h, title); v.visual.visualType = type;
  const qs = { Category: { projections: [F(cat)] }, Y: { projections: ys.map(F) } };
  if (opt && opt.y2) qs.Y2 = { projections: opt.y2.map(F) };
  v.visual.query = { queryState: qs, sortDefinition: opt && opt.sort ? opt.sort : sortBy(ys[0]) };
  const ob = v.visual.objects;
  if (opt && opt.colors) {
    ob.dataPoint = opt.colors.map(([s, c]) => ({ properties: { fill: { solid: { color: S(c) } } }, selector: { metadata: F(s).queryRef } }));
  } else if (ob.dataPoint && type !== 'pieChart') { ob.dataPoint = [{ properties: { fill: { solid: { color: S(opt && opt.color || '#00C1DE') } } } }]; }
  if (opt && opt.legend !== undefined && ob.legend) ob.legend[0].properties.show = L(String(opt.legend));
  if (opt && opt.filters) v.filterConfig = { filters: opt.filters };
  return v;
}
function pie(x, y, w, h, title, cat, y1, colors) {
  const v = base(tpl.pie, x, y, w, h, title);
  v.visual.query = { queryState: { Category: { projections: [F(cat)] }, Y: { projections: [F(y1)] } }, sortDefinition: sortBy(y1) };
  const [e, p] = [cat.split(':')[1].split('|')[0].split('.')[0], cat.split(':')[1].split('|')[0].split('.').slice(1).join('.')];
  v.visual.objects.dataPoint = Object.entries(colors).map(([val, c]) => ({ properties: { fill: { solid: { color: S(c) } } }, selector: { data: [{ scopeId: { Comparison: { ComparisonKind: 0, Left: col(e, p), Right: { Literal: { Value: "'" + val + "'" } } } } }] } }));
  return v;
}
function table(x, y, w, h, title, fields, sort, filters) {
  const v = base(tpl.table, x, y, w, h, title);
  v.visual.query = { queryState: { Values: { projections: fields.map(F) } }, sortDefinition: sort };
  if (filters) v.filterConfig = { filters };
  return v;
}
function note(x, y, w, h, text) {
  const v = base(tpl.note, x, y, w, h);
  v.visual.objects.general[0].properties.paragraphs[0].textRuns[0].value = text;
  return v;
}
function backBtn(x, y, w, h) {
  const v = base(tpl.button, x, y, w, h);
  v.visual.objects.text[0].properties.text = S('← Back');
  v.visual.visualContainerObjects.visualLink = [{ properties: { show: L('true'), type: S('Back') } }];
  v.visual.visualContainerObjects.title[0].properties.text = S('Back');
  return v;
}

// ---------- frame from the Website page ----------
const webVisualPaths = parts.filter(p => p.path.startsWith(VP(WEB))).map(p => p.path);
const contentIds = ['157ad245c33aa61a5a26', '1e188a7eb1cc6bcd1872', '3a1990ff2d9936706a0a', '56bc32687fe9260685da', '6be512fc795df35a4a55', '9d8d87803e3d8bda9ec9', 'a1fdcb0b91fb86944383', 'a5e7487667a642bf5109', 'ae62d329826fe7cad3d5', 'c9af3a7ca3218bd9c1ce'];
const frame = webVisualPaths.filter(p => !contentIds.some(c => p.includes('/' + c + '/'))).map(p => getJ(p));
const TITLE = 'd55fc6c5b0dd6537f716', SUB = 'b658181cb9640e0ec703';
function frameFor(titleA, titleB, subtitle, keepNames) {
  return frame.map(v0 => {
    const v = clone(v0);
    if (!keepNames) v.name = hex(20);
    if (v0.name === TITLE) { const r = v.visual.objects.general[0].properties.paragraphs[0].textRuns; r[0].value = titleA + ' '; r[1].value = '· ' + titleB; }
    if (v0.name === SUB) { v.visual.objects.general[0].properties.paragraphs[0].textRuns[0].value = subtitle; }
    return v;
  });
}
function writePage(pid, pageJson, visuals) {
  // remove old visuals for this page
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].path.startsWith(VP(pid))) parts.splice(i, 1);
  setJ(`definition/pages/${pid}/page.json`, pageJson);
  for (const v of visuals) setJ(VP(pid) + v.name + '/visual.json', v);
}
const webPage = getJ(`definition/pages/${WEB}/page.json`);
function newPageJson(pid, name, drillCol) {
  const pj = clone(webPage); pj.name = pid; pj.displayName = name; delete pj.visibility; delete pj.filterConfig; delete pj.pageBinding;
  if (drillCol) {
    const fid = hex(20); const [e, p] = drillCol;
    pj.filterConfig = { filters: [{ name: fid, field: col(e, p), type: 'Categorical', howCreated: 'Drillthrough' }] };
    pj.pageBinding = { name: hex(20), type: 'Drillthrough', parameters: [{ name: hex(20), boundFilter: fid, fieldExpr: col(e, p) }], acceptsFilterContext: 'None' };
  }
  return pj;
}
const R = 'revenue_orders_tbl';
const X = [336, 542, 749, 955, 1161, 1368], CW = 196, CY = 100, CH = 120;
const cards = defs => defs.map((d, i) => card(X[i], CY, CW, CH, d[0], d[1]));

// ===== 1. Website page (rebuilt) =====
{
  const vis = frameFor('Website', 'Visits, orders & invoices', 'Do website visits turn into paid orders? GA4 traffic next to the orders and invoices it led to.', true);
  vis.push(...cards([
    ['Website visits', `m:${R}.Web Visits|Visits`],
    ['Invoice views', `m:${R}.Web Invoice Views|Invoice views`],
    ['Invoice view rate', `m:${R}.Web Invoice View Rate|View rate`],
    ['Paid orders (web)', `m:${R}.Paid Orders (Web)|Paid orders (web)`],
    ['Paid revenue (web)', `m:${R}.Paid Revenue (Web)|Paid revenue (web)`],
    ['Web share of paid revenue', `m:${R}.Web Share of Paid Revenue|Web share`],
  ]));
  vis.push(note(336, 228, 1228, 30, 'Visits = one per visitor per day (GA4, consenting browsers only). Web orders = orders whose invoice was opened after a website visit. Source and Medium filters apply to orders only.'));
  vis.push(chart('lineClusteredColumnComboChart', tpl.combo, 336, 267, 608, 420, 'Do visits turn into paid orders? Visits (bars) and web paid orders (line)', 'c:Calendar.Date (format)|Date', [`m:${R}.Web Visits|Visits`], { y2: [`m:${R}.Paid Orders (Web)|Paid orders (web)`], sort: sortBy('c:Calendar.Date (format)', 'Ascending'), colors: [[`m:${R}.Web Visits`, '#00C1DE'], [`m:${R}.Paid Orders (Web)`, '#231F20']], legend: true }));
  vis.push(chart('barChart', tpl.bar, 956, 267, 608, 420, 'What happened to web orders? Invoice value by status and channel', `c:${R}.Session Channel|Channel`, [`m:${R}.Paid Revenue (Web)|Paid`, `m:${R}.Open Unpaid Revenue (Web)|Unpaid`, `m:${R}.Cancelled Revenue (Web)|Cancelled`], { colors: [[`m:${R}.Paid Revenue (Web)`, '#00C1DE'], [`m:${R}.Open Unpaid Revenue (Web)`, '#F2A900'], [`m:${R}.Cancelled Revenue (Web)`, '#E5484D']], legend: true, filters: [notIn(R, 'Session Channel', ['Not seen in GA'])] }));
  vis.push(table(336, 700, 740, 432, 'Which channels bring paying customers? Visits, invoice views and orders by channel', [
    'c:Sessions.Visit Channel|Channel', `m:${R}.Web Visits|Visits`, `m:${R}.Web Invoice Views|Invoice views`, `m:${R}.Web Invoice View Rate|View rate`,
    `m:${R}.Paid Orders by Visit Channel|Paid orders`, `m:${R}.Paid Revenue by Visit Channel|Paid revenue`, `m:${R}.Unpaid Orders by Visit Channel|Unpaid orders`, `m:${R}.Order Rate by Visit Channel|Order rate`
  ], sortBy(`m:${R}.Web Visits`)));
  vis.push(table(1086, 700, 478, 432, 'Which Google Ads campaigns pay off?', [
    'c:Sessions.Visit Ads Campaign|Campaign', `m:${R}.Web Visits|Visits`, `m:${R}.Web Invoice Views|Invoice views`, `m:${R}.Paid Orders by Visit Campaign|Paid orders`, `m:${R}.Paid Revenue by Visit Campaign|Paid revenue`
  ], sortBy(`m:${R}.Web Visits`), [notIn('Sessions', 'Visit Ads Campaign', ['Not Google Ads'])]));
  writePage(WEB, webPage, vis);
}

const ORDER_FIELDS = [
  `c:${R}.order_id|Order`, `c:${R}.order_date|Ordered`, `c:${R}.order_status|Order status`, `c:${R}.invoice_id|Invoice`, `c:${R}.invoice_status|Invoice status`,
  `c:${R}.invoice_duedate|Due`, `c:${R}.invoice_datepaid|Paid on`, `c:${R}.invoice_paymethod|Pay method`, `c:${R}.client_id|Client`, `m:${R}.Client Name|Company`,
  `c:${R}.type_of_customer|Customer type`, `c:${R}.Sales Channel|Sales channel`, `c:${R}.GA Source|GA source`, `c:${R}.Session Channel|Web channel`,
  `m:${R}.Products on Order|Products`, `m:${R}.Order Value|Value (excl. VAT)`
];
const newIds = [];
// ===== 2. Deep Dive – Orders & Invoices =====
{
  const pid = hex(20); newIds.push(pid);
  const vis = frameFor('Deep Dive', 'Orders & Invoices', 'What exactly was ordered and invoiced? Every order with its invoice, client, products and source.');
  vis.push(...cards([
    ['Orders placed', `m:${R}.Orders Placed|Orders placed`],
    ['Invoiced value', `m:${R}.Order Value|Invoiced value`],
    ['Paid orders', `m:${R}.Paid Orders (Order Date)|Paid orders`],
    ['Unpaid (collectable)', `m:${R}.Open Unpaid Revenue|Unpaid`],
    ['Cancelled (lost)', `m:${R}.Cancelled Revenue|Cancelled`],
    ['Avg days to pay', `m:${R}.Avg Days to Pay|Avg days to pay`],
  ]));
  vis.push(note(336, 228, 1118, 30, 'Order-date view: everything here is dated on the day the order was placed. Right-click an order on any page and choose Drill through to open it here.'));
  vis.push(backBtn(1464, 228, 100, 28));
  vis.push(chart('clusteredBarChart', tpl.bar, 336, 267, 400, 300, 'Where do invoices stand? Invoice value by status', `c:${R}.Status_Filter|Status`, [`m:${R}.Order Value|Invoice value`]));
  vis.push(chart('clusteredBarChart', tpl.bar, 746, 267, 400, 300, 'How do customers pay? Orders by payment method', `c:${R}.invoice_paymethod|Payment method`, [`m:${R}.Orders Placed|Orders`], { color: '#007E91' }));
  vis.push(chart('clusteredBarChart', tpl.bar, 1156, 267, 408, 300, 'What was ordered? Orders by category', `c:${R}.Category|Category`, [`m:${R}.Orders Placed|Orders`], { color: '#00C18B' }));
  vis.push(table(336, 577, 1228, 555, 'Every order and invoice', ORDER_FIELDS, sortBy(`c:${R}.order_id`)));
  writePage(pid, newPageJson(pid, 'Deep Dive – Orders & Invoices', [R, 'order_id']), vis);
}
// ===== 3. Deep Dive – Clients =====
{
  const pid = hex(20); newIds.push(pid);
  const vis = frameFor('Deep Dive', 'Clients', 'Who are our paying clients? One row per client, with their orders, payments and open invoices.');
  vis.push(...cards([
    ['Clients ordering', `m:${R}.Clients Ordering|Clients ordering`],
    ['Paying clients', `m:${R}.Paying Clients|Paying clients`],
    ['New paying clients', `m:${R}.New Paying Clients|New paying clients`],
    ['Revenue per paying client', `m:${R}.Revenue per Paying Client|Revenue per client`],
    ['Clients with open invoices', `m:${R}.Clients with Open Invoices|Open invoices`],
    ['Unpaid (collectable)', `m:${R}.Open Unpaid Revenue|Unpaid`],
  ]));
  vis.push(note(336, 228, 1118, 30, 'Paid figures use the payment date; orders, unpaid and cancelled use the order date. Select a client to list their orders on the right, or right-click a client anywhere and Drill through.'));
  vis.push(backBtn(1464, 228, 100, 28));
  vis.push(chart('clusteredBarChart', tpl.bar, 336, 267, 400, 300, 'Which client groups pay most? Paid revenue by group', `c:${R}.Client Group|Client group`, [`m:${R}.Paid Revenue (Products)|Paid revenue`]));
  vis.push(chart('clusteredBarChart', tpl.bar, 746, 267, 400, 300, 'How long have paying clients been with us? Paying clients by account age', `c:${R}.customer_tenure_group|Account age`, [`m:${R}.Paying Clients|Paying clients`], { color: '#007E91', sort: sortBy(`c:${R}.customer_tenure_group`, 'Ascending') }));
  vis.push(chart('clusteredBarChart', tpl.bar, 1156, 267, 408, 300, 'Where are they? Paid revenue by province', `c:${R}.client_state|Province`, [`m:${R}.Paid Revenue (Products)|Paid revenue`], { color: '#00C18B' }));
  vis.push(table(336, 577, 800, 555, 'Every client in the period', [
    `c:${R}.client_id|Client`, `m:${R}.Client Name|Company`, `c:${R}.Client Group|Group`, `c:${R}.client_country|Country`, `c:${R}.client_state|Province`,
    `m:${R}.Orders Placed|Orders`, `m:${R}.Paid Orders (Products)|Paid orders`, `m:${R}.Paid Revenue (Products)|Paid revenue`, `m:${R}.Open Unpaid Revenue|Unpaid`, `m:${R}.Cancelled Revenue|Cancelled`, `m:${R}.Last Order Date|Last order`
  ], sortBy(`m:${R}.Paid Revenue (Products)`)));
  vis.push(table(1146, 577, 418, 555, 'Orders for the selected client', [
    `c:${R}.order_id|Order`, `c:${R}.order_date|Ordered`, `c:${R}.invoice_status|Status`, `m:${R}.Products on Order|Products`, `m:${R}.Order Value|Value`
  ], sortBy(`c:${R}.order_id`)));
  writePage(pid, newPageJson(pid, 'Deep Dive – Clients', [R, 'client_id']), vis);
}
// ===== 4. Deep Dive – Website =====
{
  const pid = hex(20); newIds.push(pid);
  const vis = frameFor('Deep Dive', 'Website', 'Which visits led to orders? Traffic by source and every web-linked order with its session details.');
  vis.push(...cards([
    ['Website visits', `m:${R}.Web Visits|Visits`],
    ['Unique visitors', `m:${R}.Web Unique Visitors|Unique visitors`],
    ['Invoice views', `m:${R}.Web Invoice Views|Invoice views`],
    ['Paid orders (web)', `m:${R}.Paid Orders (Web)|Paid orders (web)`],
    ['Unpaid (web)', `m:${R}.Open Unpaid Revenue (Web)|Unpaid (web)`],
    ['Visit → paid order', `m:${R}.Visit to Paid Order Rate|Order rate`],
  ]));
  vis.push(note(336, 228, 1118, 30, 'Web-linked = the order\'s invoice was opened on 1-grid.com after a visit; the session is that visitor\'s first visit that day. Right-click a channel anywhere and Drill through.'));
  vis.push(backBtn(1464, 228, 100, 28));
  vis.push(chart('clusteredBarChart', tpl.bar, 336, 267, 400, 300, 'Which devices visit? Visits by device', 'c:Sessions.Visit Device|Device', [`m:${R}.Web Visits|Visits`]));
  vis.push(chart('clusteredBarChart', tpl.bar, 746, 267, 400, 300, 'Which browsers? Visits by browser', 'c:Sessions.Visit Browser|Browser', [`m:${R}.Web Visits|Visits`], { color: '#007E91' }));
  vis.push(pie(1156, 267, 408, 300, 'How much paid revenue can we trace to the website?', `c:${R}.GA Source|GA source`, `m:${R}.Paid Revenue (Products)|Paid revenue`, { 'Google Ads': '#00C1DE', 'Other': '#007E91', 'Not seen in GA': '#A7A8AB' }));
  vis.push(table(336, 577, 520, 555, 'Where does traffic come from? Visits and invoice views by source / medium', [
    'c:Sessions.Visit Source|Source', 'c:Sessions.Visit Medium|Medium', `m:${R}.Web Visits|Visits`, `m:${R}.Web Invoice Views|Invoice views`, `m:${R}.Web Invoice View Rate|View rate`
  ], sortBy(`m:${R}.Web Visits`)));
  vis.push(table(866, 577, 698, 555, 'Every web-linked order', [
    `c:${R}.order_id|Order`, `c:${R}.order_date|Ordered`, `c:${R}.invoice_status|Status`, `m:${R}.Client Name|Company`, `c:${R}.gads_campaign|Ads campaign`,
    `c:${R}.Session Channel|Channel`, `c:${R}.Session Source|Source`, `c:${R}.Session Medium|Medium`, `c:${R}.Session Device|Device`, `c:${R}.Session Browser|Browser`, `m:${R}.Order Value|Value`
  ], sortBy(`c:${R}.order_id`), [notIn(R, 'GA Source', ['Not seen in GA'])]));
  writePage(pid, newPageJson(pid, 'Deep Dive – Website', [R, 'Session Channel']), vis);
}
// ---------- page order: after Collections ----------
const pagesMeta = getJ('definition/pages/pages.json');
const after = pagesMeta.pageOrder.indexOf('42ff0aac594b28e471d9');
pagesMeta.pageOrder.splice(after + 1, 0, ...newIds);
setJ('definition/pages/pages.json', pagesMeta);
window.__newParts = parts; window.__newIds = newIds;
JSON.stringify({ parts: parts.length, newIds, measures: ent.measures.length })
