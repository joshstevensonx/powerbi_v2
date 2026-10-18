const SRC = 'd0210659-85fd-4d40-93c4-03d8683c492f';
const def = await window.__getDef(SRC);
const parts = def.definition.parts.filter(p => p.path !== '.platform').map(p => ({ path: p.path, payload: p.payload, payloadType: p.payloadType || 'InlineBase64' }));
const J = p => JSON.parse(window.__dec(p.payload));
const put = (path, obj) => { const s = window.__enc(JSON.stringify(obj, null, 2)); const p = parts.find(x => x.path === path); if (p) p.payload = s; else parts.push({ path, payload: s, payloadType: 'InlineBase64' }); };
const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n / 2))).map(b => b.toString(16).padStart(2, '0')).join('');
const L = v => ({ expr: { Literal: { Value: v } } }); const S = v => L("'" + String(v).replace(/'/g, "''") + "'");
const clone = o => JSON.parse(JSON.stringify(o));
const R = 'revenue_orders_tbl';
const EM = n => ({ Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: R } }, Property: n } });
const PAGES = ['9a1081841dbc4a123275', '1ec54bfcd1d70ac50a2f', '0763325084da6ba73a4a', 'a5941f5dc54b22118288', '5b55d9bed72362c4f7e3', '42ff0aac594b28e471d9', 'd66dab3491433d6c0245', 'c4ca7a24c1035effb2fa', 'f360781272deb00699b3'];
const log = [];
// measures
const ep = parts.find(p => p.path === 'definition/reportExtensions.json'); const ext = J(ep); const ms = ext.entities[0].measures;
const SL = ['Category', 'Sub Category', 'Product Name', 'domain', 'Domain Region', 'type_of_customer', 'customer_tenure_group', 'Sales Channel', 'Client Group', 'client_country', 'client_state', 'heard_about_us', 'service_status', 'billing_cycle', 'invoice_paymethod', 'GA Source', 'gads_campaign', 'Session Channel', 'Session Source', 'Session Medium', 'Session Device', 'Session Browser', 'Session Platform'];
const upsert = m => { const i = ms.findIndex(x => x.name === m.name); if (i >= 0) ms[i] = m; else ms.push(m); };
const AFC = { schema: 'extension', entity: R, name: 'Active Filter Count' };
upsert({ name: 'Active Filter Count', dataType: 'Double', displayFolder: 'Layout', formatString: '0', description: 'Number of filter-drawer slicers (excluding date) that have a selection.', expression: SL.map(c => `INT ( ISFILTERED ( revenue_orders_tbl[${c}] ) )`).join(' + ') });
upsert({ name: 'Active Filters Label', dataType: 'Text', displayFolder: 'Layout', description: 'Chip text next to the Filters button; empty when no filters are set.', expression: 'VAR _n = [Active Filter Count] RETURN IF ( _n > 0, _n & IF ( _n = 1, " filter on", " filters on" ), "" )', references: { measures: [AFC] } });
upsert({ name: 'Active Filters Chip Colour', dataType: 'Text', displayFolder: 'Layout', description: 'Chip background: amber tint when filters are on, page background otherwise.', expression: 'IF ( [Active Filter Count] > 0, "#FFF4DB", "#F4F6F8" )', references: { measures: [AFC] } });
put(ep.path, ext);
// helpers
const visualsOf = pid => parts.filter(p => p.path.startsWith(`definition/pages/${pid}/visuals/`));
const vtype = v => v.visual && v.visual.visualType;
const KX = 1532 / 1228, K2 = (1132 - 284) / (1132 - 228);
const tx = p => { p.x = Math.round(24 + (p.x - 336) * KX); p.width = Math.round(p.width * KX); const b = p.y + p.height; p.y = Math.round(284 + (p.y - 228) * K2); p.height = Math.round(284 + (b - 228) * K2) - p.y; };
const DELTA = { 'Paid Revenue (Products)': ['KPI Revenue Δ', 'KPI Revenue Δ Colour'], 'Paid Orders (Products)': ['KPI Orders Δ', 'KPI Orders Δ Colour'], 'Average Order Value': ['KPI AOV Δ', 'KPI AOV Δ Colour'], 'New Customer Share': ['KPI New Share Δ', 'KPI New Share Δ Colour'], 'Open Unpaid Revenue': ['KPI Unpaid Caption', null], 'Cancelled Revenue': ['KPI Cancelled Caption', null], 'Web Invoice Views': ['KPI View Rate Caption', null], 'Paid Revenue (Web)': ['KPI Web Share Caption', null] };
const CHARTS = ['clusteredBarChart', 'barChart', 'columnChart', 'clusteredColumnChart', 'lineClusteredColumnComboChart', 'pieChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'tableEx', 'pivotTable'];
const noBox = { background: [{ properties: { show: L('false') } }], border: [{ properties: { show: L('false') } }], visualHeader: [{ properties: { show: L('false') } }], dropShadow: [{ properties: { show: L('false') } }] };
const wv = visualsOf(PAGES[0]).map(J);
const tplBtn = wv.find(v => vtype(v) === 'actionButton' && JSON.stringify(v).includes('ClearAllSlicers'));
const tplLbl = wv.find(v => vtype(v) === 'textbox' && JSON.stringify(v).includes('Clear all'));
const tplCard = wv.find(v => vtype(v) === 'cardVisual' && v.position.y >= 95 && v.position.y < 130);
const bmItems = [];
for (const pid of PAGES) {
  const panel = [], newVis = [];
  for (const p of visualsOf(pid)) {
    const v = J(p); const pos = v.position; const t = vtype(v);
    if (pos.y < 95) continue;
    if (pos.x < 330) {
      if (t === 'slicer' && JSON.stringify(v.visual.query || {}).includes('Calendar.Date (format)')) {
        v.position = { ...pos, x: 184, y: 98, width: 300, height: 46, z: 60100, tabOrder: 60100 };
        if (v.visual.objects.header) v.visual.objects.header[0].properties.show = L('false');
        put(p.path, v); continue;
      }
      if (t === 'shape') { pos.y = 148; pos.height = 944; v.visual.visualContainerObjects = v.visual.visualContainerObjects || {}; v.visual.visualContainerObjects.dropShadow = [{ properties: { show: L('true') } }]; }
      else if (pos.y < 140) { pos.y += 40; if (pos.x >= 190) { pos.x = 172; pos.width = 104; } }
      else if (pos.y >= 230) { pos.y -= 40; }
      pos.z += 60000; pos.tabOrder = pos.z; v.isHidden = true; put(p.path, v); panel.push({ name: v.name, type: t });
      continue;
    }
    // KPI row
    if (t === 'cardVisual' && pos.y >= 95 && pos.y < 130) {
      const nx = Math.round(24 + (pos.x - 336) * KX), nw = Math.round(pos.width * KX);
      const pr = v.visual.query && v.visual.query.queryState.Data && v.visual.query.queryState.Data.projections;
      const m = pr && pr.length === 1 && pr[0].field.Measure && pr[0].field.Measure.Property;
      v.visual.objects.value[0].properties.fontSize = L('20D');
      v.visual.visualContainerObjects.border = [{ properties: { show: L('false') } }];
      if (m && DELTA[m]) {
        v.position = { ...pos, x: nx, width: nw, y: 148, height: 96 };
        v.visual.visualContainerObjects.padding = [{ properties: { top: L('8D'), bottom: L('0D'), left: L('14D'), right: L('10D') } }];
        const [dm, cm] = DELTA[m]; const c = clone(tplCard); c.name = hex(20);
        c.position = { x: nx, y: 242, z: pos.z + 5, width: nw, height: 32, tabOrder: pos.z + 5 };
        c.visual.query = { queryState: { Data: { projections: [{ field: EM(dm), queryRef: `${R}.${dm}`, nativeQueryRef: dm, displayName: dm }] } } };
        const val = c.visual.objects.value[0].properties; val.fontSize = L('9D'); val.fontFamily = S("'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif");
        val.fontColor = cm ? { solid: { color: { expr: EM(cm) } } } : { solid: { color: S('#55565A') } };
        c.visual.objects.layout = [{ properties: { columnCount: L('1L'), alignment: S('top'), cellPadding: L('0L') } }, { properties: { paddingUniform: L('0L'), backgroundShow: L('false') }, selector: { id: 'default' } }];
        c.visual.visualContainerObjects = { background: [{ properties: { show: L('true'), color: { solid: { color: S('#FFFFFF') } }, transparency: L('0D') } }], border: [{ properties: { show: L('false') } }], title: [{ properties: { show: L('false'), text: S('KPI delta') } }], visualHeader: [{ properties: { show: L('false') } }], padding: [{ properties: { top: L('0D'), bottom: L('8D'), left: L('14D'), right: L('10D') } }], dropShadow: [{ properties: { show: L('false') } }] };
        newVis.push(c);
      } else { v.position = { ...pos, x: nx, width: nw, y: 148, height: 126 }; }
      put(p.path, v); continue;
    }
    tx(pos);
    if (CHARTS.includes(t)) {
      const vco = v.visual.visualContainerObjects || {};
      if (vco.border) vco.border = [{ properties: { show: L('false') } }];
      const ob = v.visual.objects || {};
      if (['clusteredBarChart', 'barChart', 'columnChart', 'clusteredColumnChart'].includes(t) && ob.valueAxis && ob.labels && JSON.stringify(ob.labels).includes('true')) { ob.valueAxis[0].properties.show = L('false'); ob.valueAxis[0].properties.gridlineShow = L('false'); }
      if (ob.categoryAxis) ob.categoryAxis[0].properties.gridlineShow = L('false');
      if (t === 'lineClusteredColumnComboChart' && JSON.stringify(v.visual.query.queryState.Category || '').includes('Date (format)')) ob.categoryAxis[0].properties.axisType = S('Categorical');
    }
    put(p.path, v);
  }
  const bOpen = hex(20), bClose = hex(20);
  const fb = clone(tplBtn); fb.name = hex(20);
  fb.position = { x: 24, y: 100, z: 60210, width: 150, height: 40, tabOrder: 60210 };
  fb.visual.objects.text = [{ properties: { show: L('false') }, selector: { id: 'default' } }];
  fb.visual.objects.outline = [{ properties: { show: L('true'), lineColor: { solid: { color: S('#00C1DE') } }, weight: L('1D') }, selector: { id: 'default' } }];
  fb.visual.visualContainerObjects.visualLink = [{ properties: { show: L('true'), type: S('Bookmark'), bookmark: S(bOpen) } }];
  fb.visual.visualContainerObjects.title[0].properties.text = S('Open filters');
  const fl = clone(tplLbl); fl.name = hex(20); delete fl.isHidden;
  fl.position = { x: 24, y: 110, z: 60205, width: 150, height: 22, tabOrder: 60205 };
  const tr = fl.visual.objects.general[0].properties.paragraphs[0].textRuns[0]; tr.value = '☰  Filters'; tr.textStyle = { ...tr.textStyle, fontSize: '11pt' };
  const chip = clone(tplCard); chip.name = hex(20);
  chip.position = { x: 496, y: 106, z: 60220, width: 150, height: 30, tabOrder: 60220 };
  chip.visual.query = { queryState: { Data: { projections: [{ field: EM('Active Filters Label'), queryRef: `${R}.Active Filters Label`, nativeQueryRef: 'Active filters', displayName: 'Active filters' }] } } };
  const cv = chip.visual.objects.value[0].properties; cv.fontSize = L('10D'); cv.fontColor = { solid: { color: S('#8A5A00') } }; cv.horizontalAlignment = S('center');
  chip.visual.objects.layout = [{ properties: { columnCount: L('1L'), alignment: S('middle'), cellPadding: L('0L') } }, { properties: { paddingUniform: L('0L'), backgroundShow: L('false') }, selector: { id: 'default' } }];
  chip.visual.visualContainerObjects = { background: [{ properties: { show: L('true'), color: { solid: { color: { expr: EM('Active Filters Chip Colour') } } }, transparency: L('0D') } }], border: [{ properties: { show: L('false') } }], title: [{ properties: { show: L('false'), text: S('Active filters') } }], visualHeader: [{ properties: { show: L('false') } }], padding: [{ properties: { top: L('0D'), bottom: L('0D'), left: L('0D'), right: L('0D') } }], dropShadow: [{ properties: { show: L('false') } }] };
  const cb = clone(tplBtn); cb.name = hex(20);
  cb.position = { x: 284, y: 154, z: 70010, width: 28, height: 28, tabOrder: 70010 };
  cb.visual.objects.text = [{ properties: { show: L('false') }, selector: { id: 'default' } }];
  cb.visual.visualContainerObjects.visualLink = [{ properties: { show: L('true'), type: S('Bookmark'), bookmark: S(bClose) } }];
  cb.visual.visualContainerObjects.title[0].properties.text = S('Close filters'); cb.isHidden = true;
  const cl = clone(tplLbl); cl.name = hex(20);
  cl.position = { x: 284, y: 158, z: 70000, width: 28, height: 20, tabOrder: 70000 };
  cl.visual.objects.general[0].properties.paragraphs[0].textRuns[0].value = '✕'; cl.isHidden = true;
  newVis.push(fb, fl, chip, cb, cl);
  panel.push({ name: cb.name, type: 'actionButton' }, { name: cl.name, type: 'textbox' });
  for (const v of newVis) put(`definition/pages/${pid}/visuals/${v.name}/visual.json`, v);
  const pageName = J(parts.find(p => p.path === `definition/pages/${pid}/page.json`)).displayName;
  const mk = (bid, hidden) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/bookmark/2.1.0/schema.json', displayName: `${hidden ? 'Close' : 'Open'} filters – ${pageName}`, name: bid,
    options: { targetVisualNames: panel.map(x => x.name), suppressData: true, applyOnlyToTargetVisuals: true, suppressActiveSection: true },
    explorationState: { version: '1.3', activeSection: pid, sections: { [pid]: { visualContainers: Object.fromEntries(panel.map(x => [x.name, { singleVisual: hidden ? { visualType: x.type, objects: {}, display: { mode: 'hidden' } } : { visualType: x.type, objects: {} } }])) } } } });
  put(`definition/bookmarks/${bOpen}.bookmark.json`, mk(bOpen, false)); put(`definition/bookmarks/${bClose}.bookmark.json`, mk(bClose, true));
  bmItems.push({ name: bOpen }, { name: bClose });
  log.push(`${pageName}: panel ${panel.length}, new ${newVis.length}`);
}
const bmMeta = J(parts.find(p => p.path === 'definition/bookmarks/bookmarks.json'));
bmMeta.items.push(...bmItems);
put('definition/bookmarks/bookmarks.json', bmMeta);
window.__rdNew = parts; log.join('\n')
