const def = await window.__getDef(window.__R);
const parts = def.definition.parts.map(p => ({ path: p.path, payload: p.payload, payloadType: p.payloadType || 'InlineBase64' }));
const J = p => JSON.parse(window.__dec(p.payload)); const W = (p, o) => { p.payload = window.__enc(JSON.stringify(o, null, 2)); };
const L = v => ({ expr: { Literal: { Value: v } } }); const S = v => L("'" + String(v).replace(/'/g, "''") + "'");
const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n / 2))).map(b => b.toString(16).padStart(2, '0')).join('');
const R = 'revenue_orders_tbl', WEB = '9a1081841dbc4a123275', DDW = 'f360781272deb00699b3';
const log = [];
// ---- 1. bridge measures ----
const ep = parts.find(p => p.path === 'definition/reportExtensions.json'); const ext = J(ep); const ms = ext.entities[0].measures;
const br = (sc, rc) => `    KEEPFILTERS ( FILTER ( ALL ( Sessions[${sc}] ), NOT ISFILTERED ( revenue_orders_tbl[${rc}] ) || Sessions[${sc}] IN FILTERS ( revenue_orders_tbl[${rc}] ) ) )`;
const bridge = m => `CALCULATE ( ${m},\n${[['Visit Channel', 'Session Channel'], ['Visit Source', 'Session Source'], ['Visit Medium', 'Session Medium'], ['Visit Device', 'Session Device'], ['Visit Browser', 'Session Browser'], ['Visit Platform', 'Session Platform'], ['Visit Ads Campaign', 'gads_campaign'], ['Visit GA Source', 'GA Source']].map(([a, b]) => br(a, b)).join(',\n')}\n)`;
for (const [n, base] of [['Web Visits', '[GA Users]'], ['Web Unique Visitors', '[GA Visitors]'], ['Web Invoice Views', '[Invoice Views]']]) {
  const m = ms.find(x => x.name === n); m.expression = bridge(base);
  m.description = m.description.replace(/Follows the .*filters\./, 'Follows every Website (GA) filter: GA source, Campaign, Channel, Source, Medium, Device, Browser, Platform.');
}
const add = (name, expr, fmt, desc, refs) => { const old = ms.findIndex(x => x.name === name); const m = { name, dataType: 'Double', expression: expr, displayFolder: 'Website', description: desc, formatString: fmt, references: { measures: refs } }; if (old >= 0) ms[old] = m; else ms.push(m); };
add('Web Order Rate', 'DIVIDE ( [Paid Orders (Web)], [Web Visits] )', '0.00%', 'Web paid orders ÷ visits for the row (paid date vs visit date).', [{ schema: 'extension', entity: R, name: 'Paid Orders (Web)' }, { schema: 'extension', entity: R, name: 'Web Visits' }]);
W(ep, ext); log.push('measures ok');
// ---- 2. Website page ----
const vp = parts.filter(p => p.path.startsWith(`definition/pages/${WEB}/visuals/`));
const title = v => { try { return v.visual.visualContainerObjects.title[0].properties.text.expr.Literal.Value } catch (e) { return '' } };
const BD = { Column: { Expression: { SourceRef: { Entity: 'Breakdown' } }, Property: 'Breakdown' } };
const bdProj = { field: BD, queryRef: 'Breakdown.Breakdown', nativeQueryRef: 'Breakdown', active: true };
const ext_ = n => ({ Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: R } }, Property: n } });
const mp = (n, d) => ({ field: ext_(n), queryRef: `${R}.${n}`, nativeQueryRef: d, displayName: d });
let slicerTpl = null;
for (const p of vp) {
  const v = J(p); const t = title(v);
  if (v.visual.visualType === 'slicer' && !slicerTpl && JSON.stringify(v).includes('Session Channel')) slicerTpl = v;
  if (t.includes('What happened to web orders?')) {
    v.visual.query.queryState.Category = { projections: [bdProj] };
    v.visual.visualContainerObjects.title[0].properties.text = S('What happened to web orders? Invoice value by status and the selected breakdown');
    delete v.filterConfig; // Paid/Unpaid/Cancelled (Web) measures already exclude 'Not seen in GA'
    W(p, v); log.push('bar');
  } else if (t.includes('Which channels bring paying customers?')) {
    v.visual.query.queryState.Values = { projections: [{ field: BD, queryRef: 'Breakdown.Breakdown', nativeQueryRef: 'Breakdown' }, mp('Web Visits', 'Visits'), mp('Web Invoice Views', 'Invoice views'), mp('Web Invoice View Rate', 'View rate'), mp('Paid Orders (Web)', 'Paid orders'), mp('Paid Revenue (Web)', 'Paid revenue'), mp('Open Unpaid Orders (Web)', 'Unpaid orders'), mp('Web Order Rate', 'Order rate')] };
    v.visual.query.sortDefinition = { sort: [{ field: ext_('Web Visits'), direction: 'Descending' }], isDefaultSort: true };
    v.visual.visualContainerObjects.title[0].properties.text = S('Who brings paying customers? Visits, invoice views and orders by the selected breakdown');
    W(p, v); log.push('table');
  } else if (t.includes('Which Google Ads campaigns pay off?')) {
    v.visual.visualContainerObjects.title[0].properties.text = S('Which ad campaigns pay off? Google Ads and Bing Ads');
    v.filterConfig.filters[0].filter.Where[0].Condition.Not.Expression.In.Values = [[{ Literal: { Value: "'No ad campaign'" } }]];
    W(p, v); log.push('campaigns');
  } else if (v.visual.visualType === 'textbox' && t === "'Page note'" && v.position.y === 228) {
    v.position.width = 820;
    v.visual.objects.general[0].properties.paragraphs[0].textRuns[0].value = 'Visits = one per visitor per day (GA4, consenting browsers). Web orders = invoice opened after a visit. Use "Break down by" to switch the two breakdown visuals.';
    W(p, v); log.push('note');
  }
}
// breakdown slicer
const s = JSON.parse(JSON.stringify(slicerTpl)); s.name = hex(20);
s.position = { x: 1166, y: 222, z: 46000, height: 40, width: 398, tabOrder: 46000 };
s.visual.query = { queryState: { Values: { projections: [{ field: BD, queryRef: 'Breakdown.Breakdown', nativeQueryRef: 'Breakdown', active: true }] } }, sortDefinition: { sort: [{ field: { Column: { Expression: { SourceRef: { Entity: 'Breakdown' } }, Property: 'Breakdown Order' } }, direction: 'Ascending' }] } };
delete s.syncGroup;
const ob = s.visual.objects;
ob.data = [{ properties: { mode: S('Basic') } }];
ob.selection = [{ properties: { selectAllCheckboxEnabled: L('false'), singleSelect: L('true'), strictSingleSelect: L('true') } }];
ob.header = [{ properties: { show: L('false') } }];
ob.general = [{ properties: { orientation: L('1D'), outlineColor: { solid: { color: S('#E3E5E8') } }, outlineWeight: L('1D'), filter: { filter: { Version: 2, From: [{ Name: 'b', Entity: 'Breakdown', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'b' } }, Property: 'Breakdown' } }], Values: [[{ Literal: { Value: "'Session channel'" } }]] } } }] } } } }];
ob.items = [{ properties: { fontColor: { solid: { color: S('#231F20') } }, textSize: L('10D'), background: { solid: { color: S('#FFFFFF') } } } }];
s.visual.visualContainerObjects.title = [{ properties: { show: L('true'), text: S('Break down by'), fontSize: L('9D'), fontColor: { solid: { color: S('#55565A') } } } }];
parts.push({ path: `definition/pages/${WEB}/visuals/${s.name}/visual.json`, payload: window.__enc(JSON.stringify(s, null, 2)), payloadType: 'InlineBase64' }); log.push('slicer');
// ---- 3. pie colours (Website deep dive) ----
for (const p of parts.filter(p => p.path.startsWith(`definition/pages/${DDW}/visuals/`))) { const v = J(p); if (v.visual.visualType === 'pieChart') { const dp = v.visual.objects.dataPoint; const c = JSON.parse(JSON.stringify(dp[0])); c.properties.fill.solid.color = S('#00C18B'); c.selector.data[0].scopeId.Comparison.Right.Literal.Value = "'Bing Ads'"; dp.splice(1, 0, c); W(p, v); log.push('pie'); } }
// ---- 4. tooltip cards: split 4-value card into two rows ----
const ttIds = new Set(parts.filter(p => p.path.endsWith('/page.json')).map(J).filter(j => j.type === 'Tooltip').map(j => j.name));
const addParts = []; let split = 0;
for (const p of parts) { const m = p.path.match(/^definition\/pages\/([^/]+)\/visuals\/[^/]+\/visual\.json$/); if (!m || !ttIds.has(m[1])) continue; const v = J(p); if (v.visual.visualType !== 'cardVisual') continue; const pr = v.visual.query.queryState.Data.projections; if (pr.length < 3) continue;
  const b = JSON.parse(JSON.stringify(v)); b.name = hex(20);
  v.visual.query.queryState.Data.projections = pr.slice(0, 2); v.position = { ...v.position, x: 8, y: 8, width: 404, height: 72 };
  b.visual.query.queryState.Data.projections = pr.slice(2); b.position = { ...v.position, y: 84, z: v.position.z + 1, tabOrder: v.position.z + 1 };
  W(p, v); addParts.push({ path: `definition/pages/${m[1]}/visuals/${b.name}/visual.json`, payload: window.__enc(JSON.stringify(b, null, 2)), payloadType: 'InlineBase64' }); split++; }
parts.push(...addParts); log.push('tt split ' + split);
window.__rparts = parts; log.join(', ')
