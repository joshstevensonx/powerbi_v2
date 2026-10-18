// drawerfix.js — filter drawer won't close (handover §6.6 open bug). Redesign build ONLY.
// Adds a "Close filters" toggle under the ☰ Filters button (same x24 y100 w150 h40, visible at load, lower z),
// a hidden "✕  Close filters" textbox label, and lets the Open/Close bookmarks swap them. Removes the old
// ✕ / Done visuals (hidden at load, so they ignore mouse clicks). Run boot.js first, then set window.__R.
// Options (set before running):
//   window.__dfOnly = ['<pageId>']  patch only these pages (default: every page with an Open/Close filters pair)
//   window.__dfPush = true          push with updateDefinition (default: dry run, result kept in window.__dfParts)
//   window.__dfKeepOld = true       keep the old ✕ / Done visuals instead of removing them
// Undo: await window.__dfRestore()  pushes the definition read at the start of this run back onto __R.
if (window.__R !== '47b9663c-4c3e-4039-84ab-f04d71d1570d') throw new Error('drawerfix.js: set window.__R to the redesign build 47b9663c…');
const UPD = `https://api.fabric.microsoft.com/v1/workspaces/${window.__W}/reports/${window.__R}/updateDefinition`;
const def = await window.__getDef(window.__R);
if (!def || !def.definition) throw new Error('getDefinition failed: ' + JSON.stringify(def).slice(0, 300));
const orig = def.definition.parts.filter(p => p.path !== '.platform').map(p => ({ path: p.path, payload: p.payload, payloadType: p.payloadType || 'InlineBase64' }));
window.__dfOrig = orig;
window.__dfRestore = async () => window.__lro(await fetch(UPD, { method: 'POST', headers: window.__H(), body: JSON.stringify({ definition: { parts: window.__dfOrig } }) }));
let P = orig.map(p => ({ ...p }));
const J = p => JSON.parse(window.__dec(p.payload));
const put = (path, obj) => { const s = window.__enc(JSON.stringify(obj, null, 2)); const p = P.find(x => x.path === path); if (p) p.payload = s; else P.push({ path, payload: s, payloadType: 'InlineBase64' }); };
const L = v => ({ expr: { Literal: { Value: v } } }); const S = v => L("'" + String(v).replace(/'/g, "''") + "'");
const clone = o => JSON.parse(JSON.stringify(o));
const vt = v => v.visual && v.visual.visualType;
const link = v => v.visual?.visualContainerObjects?.visualLink?.[0]?.properties?.bookmark?.expr?.Literal?.Value?.replace(/'/g, '');
const txt = v => { try { return v.visual.objects.general[0].properties.paragraphs.map(pp => pp.textRuns.map(t => t.value).join('')).join('') } catch (e) { return '' } };
const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
// stable 20-hex names, so a re-run updates the same visuals instead of adding new ones
const nm = s => [0x811c9dc5, 0x01000193, 0x5bd1e995].map(seed => { let h = seed >>> 0; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h.toString(16).padStart(8, '0'); }).join('').slice(0, 20);
const slicers = parts => parts.filter(p => /\/visuals\/[^/]+\/visual\.json$/.test(p.path) && vt(J(p)) === 'slicer').length;
const slicersBefore = slicers(P);
const bms = P.filter(p => /^definition\/bookmarks\/[^/]+\.bookmark\.json$/.test(p.path)).map(p => ({ path: p.path, b: J(p) }));
const pairs = {};
for (const x of bms) { const m = /^(Open|Close) filters – /.exec(x.b.displayName || ''); if (!m) continue; const pid = x.b.explorationState.activeSection; (pairs[pid] = pairs[pid] || {})[m[1].toLowerCase()] = x; }
const pids = Object.keys(pairs).filter(pid => !window.__dfOnly || window.__dfOnly.includes(pid));
const log = [], bad = [];
const TOG = { x: 24, y: 100, width: 150, height: 40 };
for (const pid of pids) {
  const { open, close } = pairs[pid];
  if (!open || !close) { bad.push(`${pid}: missing Open or Close bookmark`); continue; }
  const pg = J(P.find(p => p.path === `definition/pages/${pid}/page.json`));
  if (pg.width !== 1580 || pg.height !== 1148) { bad.push(`${pg.displayName}: page is ${pg.width}×${pg.height}, expected 1580×1148`); continue; }
  const vis = P.filter(p => p.path.startsWith(`definition/pages/${pid}/visuals/`) && p.path.endsWith('/visual.json')).map(p => ({ p, v: J(p) }));
  const nBtn = nm(pid + ':closeToggle'), nLbl = nm(pid + ':closeToggleLabel');
  const fBtn = vis.filter(x => vt(x.v) === 'actionButton' && link(x.v) === open.b.name);
  if (fBtn.length !== 1) { bad.push(`${pg.displayName}: ${fBtn.length} buttons link to the Open bookmark, expected 1`); continue; }
  const fb = fBtn[0].v;
  const fLbl = vis.filter(x => vt(x.v) === 'textbox' && !x.v.isHidden && /Filters/.test(txt(x.v)) && x.v.name !== nLbl && hit(x.v.position, fb.position));
  if (fLbl.length !== 1) { bad.push(`${pg.displayName}: ${fLbl.length} "☰ Filters" labels on the Filters button, expected 1`); continue; }
  const fl = fLbl[0].v;
  if (!fb.visual?.visualContainerObjects?.visualLink?.[0]?.properties) { bad.push(`${pg.displayName}: Filters button has no visualLink`); continue; }
  if (![open.b, close.b].every(bm => bm.options && bm.explorationState.sections?.[pid]?.visualContainers)) { bad.push(`${pg.displayName}: Open/Close bookmark has no section for its page`); continue; }
  // old close visuals: in the Close bookmark's targets and either a button to Close, a "Done"/"✕" label, or the Done bar shape
  const tgt = new Set(close.b.options.targetVisualNames || []);
  const old = window.__dfKeepOld ? [] : vis.filter(x => x.v.name !== nBtn && x.v.name !== nLbl && tgt.has(x.v.name) && (
    (vt(x.v) === 'actionButton' && link(x.v) === close.b.name) ||
    (vt(x.v) === 'textbox' && ['Done', '✕'].includes(txt(x.v).trim())) ||
    (vt(x.v) === 'shape' && x.v.position.y >= 1000 && x.v.position.height <= 80)));
  const drop = new Set(old.map(x => x.v.name));
  // z: the toggle must sit above any drawer visual that overlaps its spot (visible while the drawer is open)
  const ours = new Set([fb.name, fl.name, nBtn, nLbl, ...drop]);
  const overZ = Math.max(0, ...vis.filter(x => !ours.has(x.v.name) && hit(x.v.position, TOG)).map(x => x.v.position.z || 0));
  const B = Math.max(fb.position.z, overZ + 20);
  fb.position.z = fb.position.tabOrder = B; fl.position.z = fl.position.tabOrder = B - 5;
  put(fBtn[0].p.path, fb); put(fLbl[0].p.path, fl);
  const cb = clone(fb); cb.name = nBtn; delete cb.isHidden;
  cb.position = { ...fb.position, z: B - 10, tabOrder: B - 10 };
  cb.visual.visualContainerObjects.visualLink[0].properties.bookmark = S(close.b.name);
  if (cb.visual.visualContainerObjects.title?.[0]?.properties) cb.visual.visualContainerObjects.title[0].properties.text = S('Close filters');
  const cl = clone(fl); cl.name = nLbl; cl.isHidden = true;
  cl.position = { ...fl.position, z: B - 15, tabOrder: B - 15 };
  const para = cl.visual.objects.general[0].properties.paragraphs; para.splice(1); para[0].textRuns.splice(1); para[0].textRuns[0].value = '✕  Close filters';
  put(`definition/pages/${pid}/visuals/${nBtn}/visual.json`, cb); put(`definition/pages/${pid}/visuals/${nLbl}/visual.json`, cl);
  P = P.filter(p => ![...drop].some(n => p.path.startsWith(`definition/pages/${pid}/visuals/${n}/`)));
  // bookmarks: Open hides Filters button + label and shows the close label; Close does the reverse.
  // The close button itself is never toggled, so it keeps isHidden:false from load.
  const st = (bm, v, hidden) => { bm.options.targetVisualNames.push(v.name); bm.explorationState.sections[pid].visualContainers[v.name] = { singleVisual: hidden ? { visualType: vt(v), objects: {}, display: { mode: 'hidden' } } : { visualType: vt(v), objects: {} } }; };
  for (const [bm, isOpen] of [[open.b, true], [close.b, false]]) {
    const vc = bm.explorationState.sections[pid].visualContainers;
    const skip = new Set([...drop, fb.name, fl.name, nBtn, nLbl]);
    bm.options.targetVisualNames = (bm.options.targetVisualNames || []).filter(n => !skip.has(n));
    for (const n of skip) delete vc[n];
    st(bm, fb, isOpen); st(bm, fl, isOpen); st(bm, cl, !isOpen);
  }
  put(open.path, open.b); put(close.path, close.b);
  // checks on the patched page
  const after = P.filter(p => p.path.startsWith(`definition/pages/${pid}/visuals/`) && p.path.endsWith('/visual.json')).map(J);
  const names = new Set(after.map(v => v.name));
  for (const bm of [open.b, close.b]) for (const n of bm.options.targetVisualNames) if (!names.has(n)) bad.push(`${bm.displayName}: target ${n} not on the page`);
  const nOpen = after.filter(v => vt(v) === 'actionButton' && link(v) === open.b.name).length, nClose = after.filter(v => vt(v) === 'actionButton' && link(v) === close.b.name).length;
  if (nOpen !== 1 || nClose !== 1) bad.push(`${pg.displayName}: ${nOpen} Open / ${nClose} Close buttons after patch, expected 1 / 1`);
  const left = after.filter(v => v.isHidden && ['Done', '✕'].includes(txt(v).trim())).length;
  log.push(`${pg.displayName}: z${B} (overlap z${overZ}), removed ${drop.size} [${old.map(x => vt(x.v) + (vt(x.v) === 'textbox' ? ':' + txt(x.v).trim() : '')).join(', ')}]${left && !window.__dfKeepOld ? `, ${left} hidden Done/✕ labels left` : ''}`);
}
if (slicers(P) !== slicersBefore) bad.push(`slicer count changed ${slicersBefore} → ${slicers(P)}`);
if (!pids.length) bad.push('no pages matched');
window.__dfParts = P;
let res = 'dry run (set window.__dfPush = true to push)';
if (bad.length) res = 'NOT PUSHED: fix the problems above';
else if (window.__dfPush === true) {
  const r = await window.__lro(await fetch(UPD, { method: 'POST', headers: window.__H(), body: JSON.stringify({ definition: { parts: P } }) }));
  const chk = await window.__getDef(window.__R);
  const ok = chk && chk.definition && pids.every(pid => chk.definition.parts.some(p => p.path === `definition/pages/${pid}/visuals/${nm(pid + ':closeToggle')}/visual.json`));
  res = 'push: ' + JSON.stringify(r) + ' · re-read: ' + (ok ? 'OK, toggles present' : 'FAILED ' + JSON.stringify(chk).slice(0, 300) + ' → run await window.__dfRestore()');
}
window.__show(`drawerfix · ${pids.length} page(s) · slicers ${slicersBefore}\n${log.join('\n')}\n${bad.length ? 'PROBLEMS:\n' + bad.join('\n') + '\n' : ''}${res}`);
