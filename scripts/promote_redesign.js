// promote_redesign.js — copy the redesign build (47b9663c…) onto the LIVE Daily sales (v3.0) (d0210659…).
// ONLY after Josh has approved in writing. Run boot.js first. Steps: 1 clone live as a dated backup,
// 2 getDefinition from the build, 3 updateDefinition onto live (same ID/URL), 4 re-read live to confirm.
// Afterwards, by hand: open live, hover-test tooltips, open/close the drawer on every page, Reset to default.
// Guard: window.__promoteApproved = 'Josh approved <date/where>'   (anything else stops the script)
if (!/^Josh approved .+/.test(window.__promoteApproved || '')) throw new Error('promote_redesign.js: needs window.__promoteApproved = "Josh approved <date/where>"');
const LIVE = 'd0210659-85fd-4d40-93c4-03d8683c492f', BUILD = '47b9663c-4c3e-4039-84ab-f04d71d1570d';
const day = new Date().toISOString().slice(0, 10);
const log = [];
// 1 backup clone of live (Power BI REST)
const bk = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${window.__W}/reports/${LIVE}/Clone`, { method: 'POST', headers: window.__H(), body: JSON.stringify({ name: `Daily sales (v3.0) - backup before redesign ${day}`, targetWorkspaceId: window.__W }) });
const bkj = await bk.json().catch(() => ({}));
if (!bk.ok || !bkj.id) { window.__show('backup clone FAILED, nothing pushed: ' + bk.status + ' ' + JSON.stringify(bkj).slice(0, 400)); throw new Error('backup failed'); }
log.push(`backup: ${bkj.name} ${bkj.id}`);
// 2 build definition, without .platform so live keeps its own name
const def = await window.__getDef(BUILD);
if (!def || !def.definition) { window.__show(log.join('\n') + '\nbuild getDefinition FAILED, nothing pushed: ' + JSON.stringify(def).slice(0, 400)); throw new Error('getDefinition failed'); }
const parts = def.definition.parts.filter(p => p.path !== '.platform').map(p => ({ path: p.path, payload: p.payload, payloadType: p.payloadType || 'InlineBase64' }));
log.push(`build parts: ${parts.length}`);
// 3 push onto live
const r = await window.__lro(await fetch(`https://api.fabric.microsoft.com/v1/workspaces/${window.__W}/reports/${LIVE}/updateDefinition`, { method: 'POST', headers: window.__H(), body: JSON.stringify({ definition: { parts } }) }));
log.push('updateDefinition: ' + JSON.stringify(r).slice(0, 300));
// 4 re-read live
const chk = await window.__getDef(LIVE);
log.push(chk && chk.definition ? `live re-read OK: ${chk.definition.parts.length} parts` : 'live re-read FAILED: ' + JSON.stringify(chk).slice(0, 300) + ` → restore: getDefinition(${bkj.id}) and updateDefinition onto live`);
window.__show(log.join('\n'));
