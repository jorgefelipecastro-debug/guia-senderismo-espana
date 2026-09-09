/* Allzone V16.2 - navigation + photo pipeline hardening */
(function(){
'use strict';
if(window.AllzoneV162)return;
const VERSION='V16.2 - NAVEGACION Y FOTOS CORREGIDAS';
const photoStore=new Map();
let photoRevision=0;
let lastPdfRevision=-1;
let lastPhotoPdf=null;
let lastPhotoPdfName='';
let pdfBusy=false;
let moving=false;

const EXTRA_OPTIONAL=[
  {key:'scene',label:'Posicion de los vehiculos / entorno',required:false},
  {key:'docs',label:'Documentacion adicional',required:false}
];

function safeText(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function targetList(){
  const out=[
    {key:'a_damage',label:'Vehiculo A · Foto del dano',required:true},
    {key:'a_plate_photo',label:'Vehiculo A · Foto de la matricula',required:true},
    {key:'b_damage',label:'Vehiculo B · Foto del dano',required:true},
    {key:'b_plate_photo',label:'Vehiculo B · Foto de la matricula',required:true}
  ];
  if(state.other_vehicles_damage==='Si'||state.other_vehicles_damage==='Sí'){
    const n=Math.max(0,Math.min(20,parseInt(state.additional_vehicle_count||'0',10)||0));
    for(let i=0;i<n;i++){
      const L=typeof extraLabel==='function'?extraLabel(i):String.fromCharCode(67+i);
      out.push({key:`extra_${i}_damage`,label:`Vehiculo ${L} · Foto del dano`,required:true});
      out.push({key:`extra_${i}_plate_photo`,label:`Vehiculo ${L} · Foto de la matricula`,required:true});
    }
  }
  return out.concat(EXTRA_OPTIONAL);
}
window.photoTargets=targetList;

function humanSize(bytes){
  if(!Number.isFinite(bytes))return '';
  if(bytes<1024*1024)return Math.max(1,Math.round(bytes/1024))+' KB';
  return (bytes/1024/1024).toFixed(1)+' MB';
}
function revoke(rec){if(rec&&rec.url){try{URL.revokeObjectURL(rec.url);}catch(_){}}}
function invalidatePdf(){lastPhotoPdf=null;lastPhotoPdfName='';lastPdfRevision=-1;photoRevision++;}
function setStatus(text,bad=false){const n=document.getElementById('v162PdfStatus');if(n){n.textContent=text||'';n.className='v162-status'+(bad?' bad':'');}}
function setNavError(text){let n=document.getElementById('v162NavError');if(!n){n=document.createElement('div');n.id='v162NavError';n.className='v162-nav-error';host.prepend(n);}n.textContent=text;n.hidden=false;}
function clearNavError(){document.getElementById('v162NavError')?.remove();}

const style=document.createElement('style');
style.textContent=`
.v16-banner{background:#075f57!important}.v162-nav-error{background:#fff1ef;border:1px solid #e6aaa1;color:#922b20;padding:11px;border-radius:10px;font:700 13px/1.4 Arial;margin:0 0 12px}.v162-photo-card{border:1px solid #dbe5e2;border-radius:15px;padding:13px;margin:12px 0;background:#fff}.v162-photo-card h3{font-size:16px;margin:0 0 7px}.v162-preview{display:block;width:100%;height:190px;object-fit:contain;background:#f4f7f6;border:1px solid #d7e0de;border-radius:10px;margin:8px 0}.v162-empty{height:86px;display:grid;place-items:center;border:1px dashed #b7c4c1;border-radius:10px;background:#f6f8f8;color:#67736f;font-size:13px;margin:8px 0}.v162-actions{display:flex;gap:8px;flex-wrap:wrap}.v162-actions label,.v162-actions button,.v162-primary,.v162-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 12px;border-radius:10px;border:1px solid #bed0cc;background:#fff;color:#075f57;font:800 13px Arial;cursor:pointer}.v162-actions input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.v162-primary,.v162-secondary{width:100%;min-height:49px;margin:7px 0}.v162-primary{background:#087f73;color:#fff;border:0}.v162-secondary{background:#fff}.v162-primary:disabled,.v162-secondary:disabled{opacity:.55;cursor:wait}.v162-status{font:13px/1.45 Arial;color:#44615a;margin:8px 0;overflow-wrap:anywhere}.v162-status.bad{color:#a32116}.v162-how{background:#eaf7f3;border-radius:11px;padding:12px;font:13px/1.5 Arial;color:#194e45;margin-top:10px}.v162-ready{color:#0a6a5d;font-weight:800}.v162-photo-meta{font-size:12px;color:#6a7773;margin-top:4px}.v162-review{display:grid;gap:8px}.v162-review button{min-height:50px;border-radius:12px;border:0;background:#087f73;color:#fff;font-weight:900}.v162-review button.alt{background:#fff;color:#075f57;border:1px solid #b9cbc7}
`;
document.head.appendChild(style);
const banner=document.querySelector('.v16-banner');if(banner)banner.textContent=VERSION;
document.title='Allzone '+VERSION;

function card(t){
  const rec=photoStore.get(t.key);
  return `<section class="v162-photo-card" data-photo-card="${t.key}"><h3>${safeText(t.label)}${t.required?' *':' (opcional)'}</h3><div data-photo-preview="${t.key}">${rec?`<img class="v162-preview" src="${rec.url}" alt="${safeText(t.label)}">`:'<div class="v162-empty">Sin fotografia</div>'}</div><div class="v162-actions"><label>Camara<input type="file" accept="image/*" capture="environment" data-photo-input="${t.key}"></label><label>Biblioteca<input type="file" accept="image/*" data-photo-input="${t.key}"></label>${rec?`<button type="button" data-photo-remove="${t.key}">Quitar</button>`:''}</div><div class="v162-photo-meta" data-photo-meta="${t.key}">${rec?`<span class="v162-ready">Lista</span> · ${safeText(rec.name||'foto')} · ${humanSize(rec.file.size)}`:'La foto queda lista en cuanto la seleccionas; no se comprime en esta pantalla.'}</div></section>`;
}

function refreshPhotoCard(key){
  const t=targetList().find(x=>x.key===key);if(!t)return;
  const old=host.querySelector(`[data-photo-card="${CSS.escape(key)}"]`);if(!old)return;
  const wrap=document.createElement('div');wrap.innerHTML=card(t);const fresh=wrap.firstElementChild;old.replaceWith(fresh);bindPhotoCard(fresh);
}
function bindPhotoCard(root){
  root.querySelectorAll('[data-photo-input]').forEach(inp=>{
    inp.onchange=()=>{
      const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
      if(f.size===0){alert('La fotografia esta vacia. Hazla de nuevo.');return;}
      if(f.size>60*1024*1024){alert('La fotografia supera 60 MB. Hazla desde la camara de la aplicacion o selecciona una copia mas pequena.');return;}
      const key=inp.dataset.photoInput,old=photoStore.get(key);revoke(old);
      const rec={file:f,url:URL.createObjectURL(f),name:f.name||('foto-'+Date.now()+'.jpg'),type:f.type||''};
      photoStore.set(key,rec);state[key+'_name']=rec.name;invalidatePdf();refreshPhotoCard(key);refreshPdfButtons();
    };
  });
  root.querySelectorAll('[data-photo-remove]').forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.photoRemove;revoke(photoStore.get(key));photoStore.delete(key);delete state[key+'_name'];invalidatePdf();refreshPhotoCard(key);refreshPdfButtons();
  });
}
function refreshPdfButtons(){
  const has=targetList().some(t=>photoStore.has(t.key));
  const d=document.getElementById('v162DownloadPdf'),s=document.getElementById('v162SharePdf');
  if(d)d.disabled=pdfBusy||!has;if(s)s.disabled=pdfBusy||!has;
}
function bindPhotoScreen(){
  host.querySelectorAll('[data-photo-card]').forEach(bindPhotoCard);
  document.getElementById('v162DownloadPdf').onclick=()=>downloadPhotoPdf(false);
  document.getElementById('v162SharePdf').onclick=()=>downloadPhotoPdf(true);
  refreshPdfButtons();
}
window.photoScreen=function(){
  host.innerHTML=`<div class="eyebrow">Evidencias</div><h1>Fotografias del accidente</h1><p class="lead">La seleccion es inmediata: al ver “Lista” puedes seguir. El PDF se prepara solo cuando pulses descargar o compartir.</p>${targetList().map(card).join('')}<div class="card"><button type="button" class="v162-primary" id="v162DownloadPdf">DESCARGAR FOTOS EN PDF</button><button type="button" class="v162-secondary" id="v162SharePdf">COMPARTIR PDF · WHATSAPP</button><div id="v162PdfStatus" class="v162-status" role="status"></div><div class="v162-how"><b>WhatsApp:</b> pulsa “Compartir PDF” y elige WhatsApp. Si el navegador no permite compartir archivos, la aplicacion descargara el PDF para adjuntarlo desde WhatsApp como Documento.</div></div>`;
  bindPhotoScreen();
};

function timeout(p,ms,message){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(message)),ms))]);}
async function decodeFile(file){
  if('createImageBitmap' in window){
    try{
      const bm=await timeout(createImageBitmap(file,{imageOrientation:'from-image'}),12000,'La imagen tarda demasiado en abrirse.');
      return {source:bm,width:bm.width,height:bm.height,close:()=>bm.close?.()};
    }catch(_){/* fallback below */}
  }
  const url=URL.createObjectURL(file);
  try{
    const img=await timeout(new Promise((ok,fail)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>fail(new Error('Formato de imagen no compatible.'));im.src=url;}),12000,'La imagen tarda demasiado en abrirse.');
    return {source:img,width:img.naturalWidth,height:img.naturalHeight,close:()=>{}};
  }finally{URL.revokeObjectURL(url);}
}
function canvasJpegBlob(c,quality=.84){return new Promise((ok,fail)=>c.toBlob(b=>b?ok(b):fail(new Error('No se pudo preparar la pagina del PDF.')),'image/jpeg',quality));}
async function blobBytes(blob){return new Uint8Array(await blob.arrayBuffer());}
function makePdf(pages){
  const enc=new TextEncoder(),parts=[],off=[0];let len=0;
  const write=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length;};
  const obj=(id,body)=>{off[id]=len;write(id+' 0 obj\n'+body+'\nendobj\n');};
  write('%PDF-1.4\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  pages.forEach((p,i)=>{
    const id=3+i*3;
    obj(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im '+(id+2)+' 0 R >> >> /Contents '+(id+1)+' 0 R >>');
    const content='q\n595 0 0 842 0 0 cm\n/Im Do\nQ\n';
    obj(id+1,'<< /Length '+enc.encode(content).length+' >>\nstream\n'+content+'endstream');
    off[id+2]=len;write((id+2)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.width+' /Height '+p.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n');write(p.bytes);write('\nendstream\nendobj\n');
  });
  const xref=len,n=3+pages.length*3;write('xref\n0 '+n+'\n0000000000 65535 f \n');for(let i=1;i<n;i++)write(String(off[i]).padStart(10,'0')+' 00000 n \n');write('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(parts,{type:'application/pdf'});
}
async function buildPhotoPdf(){
  if(lastPhotoPdf&&lastPdfRevision===photoRevision)return {blob:lastPhotoPdf,name:lastPhotoPdfName};
  const ts=targetList().filter(t=>photoStore.has(t.key));if(!ts.length)throw new Error('No hay fotografias para generar el PDF.');
  const pages=[];
  for(let i=0;i<ts.length;i+=2){
    const group=ts.slice(i,i+2),pageNo=(i/2)+1,totalPages=Math.ceil(ts.length/2);setStatus(`Preparando PDF · pagina ${pageNo} de ${totalPages}...`);
    const c=document.createElement('canvas');c.width=1100;c.height=1556;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#087f73';x.fillRect(0,0,c.width,12);x.fillStyle='#12322d';x.font='900 35px Arial';x.fillText('ALLZONE LOGISTICS',62,54);x.font='900 37px Arial';x.fillText('Anexo fotografico del accidente',62,106);x.fillStyle='#536460';x.font='22px Arial';x.fillText(`${state.acc_date||''} ${state.acc_time||''} · A ${state.a_plate||''} · B ${state.b_plate||''}`,62,158);
    let y=215;
    for(const t of group){
      const rec=photoStore.get(t.key);x.strokeStyle='#cbd6d3';x.lineWidth=2;x.strokeRect(58,y,984,605);x.fillStyle='#eaf4f1';x.fillRect(59,y+1,982,52);x.fillStyle='#173c34';x.font='800 24px Arial';x.fillText(t.label,78,y+14);
      let decoded;
      try{decoded=await decodeFile(rec.file);}catch(err){throw new Error(`${t.label}: ${err.message}`);}
      try{const sc=Math.min(920/decoded.width,500/decoded.height,1.5),w=decoded.width*sc,h=decoded.height*sc;x.drawImage(decoded.source,90+(920-w)/2,y+74+(500-h)/2,w,h);}finally{decoded.close?.();}
      x.fillStyle='#61716c';x.font='18px Arial';x.fillText(`${rec.name} · ${humanSize(rec.file.size)}`,78,y+570);y+=640;
    }
    const jpg=await canvasJpegBlob(c,.84);pages.push({width:c.width,height:c.height,bytes:await blobBytes(jpg)});c.width=1;c.height=1;await new Promise(r=>setTimeout(r,0));
  }
  lastPhotoPdf=makePdf(pages);lastPdfRevision=photoRevision;lastPhotoPdfName=`FOTOS_ALLZONE_${String(state.a_plate||'A').replace(/[^A-Za-z0-9_-]/g,'_')}_${String(state.b_plate||'B').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;
  return {blob:lastPhotoPdf,name:lastPhotoPdfName};
}
function downloadBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function downloadPhotoPdf(share){
  if(pdfBusy)return;pdfBusy=true;refreshPdfButtons();
  try{
    const {blob,name}=await buildPhotoPdf();setStatus(`PDF listo · ${(blob.size/1024/1024).toFixed(2)} MB.`);
    if(share){
      const file=new File([blob],name,{type:'application/pdf'});
      const payload={title:'Fotos del accidente Allzone',text:`Parte ${state.a_plate||'A'} / ${state.b_plate||'B'}`,files:[file]};
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        try{await navigator.share(payload);setStatus('PDF compartido. Si elegiste WhatsApp, ya puedes seleccionar el chat.');return;}catch(err){if(err&&err.name==='AbortError'){setStatus('Compartir cancelado. El PDF sigue listo.');return;}}
      }
      downloadBlob(blob,name);setStatus('Tu navegador no permite compartir el PDF directamente. Se ha descargado: abre WhatsApp → clip/+ → Documento y selecciona el PDF.');
    }else downloadBlob(blob,name);
  }catch(err){setStatus(err.message||'No se pudo generar el PDF.',true);}
  finally{pdfBusy=false;refreshPdfButtons();}
}

function requiredMissing(){return [...host.querySelectorAll('[required]')].filter(el=>el.type!=='file'&&!el.disabled&&!String(el.value||'').trim());}
function validateCurrent(){
  clearNavError();sync();const miss=requiredMissing();if(miss.length){const names=miss.map(el=>el.closest('.field')?.querySelector('label')?.textContent?.trim()||el.dataset.field||'dato');setNavError('Falta completar: '+names.join(', ')+'.');miss[0].focus({preventScroll:true});miss[0].scrollIntoView({block:'center'});return false;}
  const step=getSteps()[idx],title=step?.title||'';
  if(title==='Tipo A'&&!state.a_vehicle_type){setNavError('Selecciona Moto, Coche o Camion para el vehiculo A.');return false;}
  if(title==='Tipo B'&&!state.b_vehicle_type){setNavError('Selecciona Moto, Coche o Camion para el vehiculo B.');return false;}
  if(title==='Numero vehiculos adicionales'||title==='Número vehículos adicionales'){
    const n=parseInt(state.additional_vehicle_count||'0',10);if(!n||n<1||n>20){setNavError('Indica entre 1 y 20 vehiculos adicionales.');return false;}if(typeof ensureExtraDefaults==='function')ensureExtraDefaults();
  }
  if(title==='Fotos'){
    const missing=targetList().filter(t=>t.required&&!photoStore.has(t.key));if(missing.length){setNavError('Faltan fotos obligatorias: '+missing.map(t=>t.label).join(', ')+'.');return false;}
  }
  return true;
}
function transition(delta){
  if(moving||pdfBusy)return;const from=idx;sync();if(delta>0&&!validateCurrent())return;moving=true;nextBtn.disabled=true;
  try{
    const steps=getSteps();if(delta>0&&idx>=steps.length-1){window.AllzoneV16?.openDaa?.();return;}
    idx=Math.max(0,Math.min(steps.length-1,idx+delta));const t0=performance.now();window.render();const elapsed=performance.now()-t0;console.info('[Allzone V16.2] render',getSteps()[idx]?.title,Math.round(elapsed)+'ms');
  }catch(err){console.error('[Allzone V16.2] navigation error',err);idx=from;try{window.render();}catch(_){}setNavError('No se pudo abrir el siguiente paso. Tus datos no se han borrado. Pulsa Continuar de nuevo.');}
  finally{moving=false;nextBtn.disabled=false;}
}
nextBtn.onclick=e=>{e.preventDefault();transition(1);};
backBtn.onclick=e=>{e.preventDefault();transition(-1);};

const previousRender=window.render;
window.render=function(){const t0=performance.now();previousRender();const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;document.title='Allzone '+VERSION;nextBtn.disabled=false;clearNavError();const elapsed=performance.now()-t0;if(elapsed>180)console.warn('[Allzone V16.2] pantalla lenta',getSteps()[idx]?.title,Math.round(elapsed)+'ms');};

const previousReview=window.reviewScreen;
window.reviewScreen=function(){
  if(typeof previousReview==='function')previousReview();
  const cardNode=host.querySelector('.v16-review')||host.querySelector('.card:last-of-type');
  if(cardNode){cardNode.innerHTML=`<div class="v162-review"><button type="button" id="v162Daa">VER / GUARDAR PARTE DAA</button><button type="button" class="alt" id="v162PhotosDownload">DESCARGAR FOTOS EN PDF</button><button type="button" class="alt" id="v162PhotosShare">COMPARTIR FOTOS · WHATSAPP</button><div id="v162PdfStatus" class="v162-status"></div></div>`;document.getElementById('v162Daa').onclick=()=>window.AllzoneV16?.openDaa?.();document.getElementById('v162PhotosDownload').onclick=()=>downloadPhotoPdf(false);document.getElementById('v162PhotosShare').onclick=()=>downloadPhotoPdf(true);}
};

window.AllzoneV162={version:VERSION,photoStore,buildPhotoPdf,validateCurrent,transition};
window.render();
})();