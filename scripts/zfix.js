const P=window.__parts.map(p=>({path:p.path,payload:p.payload,payloadType:p.payloadType||'InlineBase64'})); const J=p=>JSON.parse(window.__dec(p.payload)); const W=(p,o)=>{p.payload=window.__enc(JSON.stringify(o,null,2))};
const closeBm=new Set(P.filter(p=>p.path.includes('bookmarks/')&&p.path.endsWith('.bookmark.json')).map(J).filter(b=>/^Close filters/.test(b.displayName)).map(b=>b.name));
const pages={}; for(const p of P){const m=p.path.match(/^definition\/pages\/([^/]+)\/visuals\/[^/]+\/visual\.json$/); if(m)(pages[m[1]]=pages[m[1]]||[]).push(p);}
const txt=v=>{try{return v.visual.objects.general[0].properties.paragraphs.map(pp=>pp.textRuns.map(t=>t.value).join('')).join('')}catch(e){return ''}};
const log=[];
for(const [pg,vs] of Object.entries(pages)){
  const objs=vs.map(p=>[p,J(p)]); const maxZ=Math.max(...objs.map(([,v])=>v.position.z||0));
  let n=0;
  for(const [p,v] of objs){
    const t=v.visual.visualType; let add=null;
    if(t==='actionButton'){const bm=v.visual.visualContainerObjects?.visualLink?.[0]?.properties?.bookmark?.expr?.Literal?.Value?.replace(/'/g,''); if(bm&&closeBm.has(bm)) add=30;}
    else if(t==='textbox'&&v.isHidden&&(txt(v).trim()==='Done'||txt(v).trim()==='✕')) add=20;
    else if(t==='shape'&&v.isHidden&&v.position.x===28&&v.position.y===1092) add=10;
    if(add!==null){const base=Math.max(maxZ,100000); const z=base+add+(v.position.x>200?100:0); v.position.z=z; v.position.tabOrder=z; W(p,v); n++;}
  }
  log.push(pg.slice(0,6)+':max'+maxZ+':n'+n);
}
const r=await window.__lro(await fetch(`https://api.fabric.microsoft.com/v1/workspaces/${window.__W}/reports/${window.__R}/updateDefinition`,{method:'POST',headers:window.__H(),body:JSON.stringify({definition:{parts:P}})}));
window.__show(log.join(' ')+'\n'+JSON.stringify(r));
