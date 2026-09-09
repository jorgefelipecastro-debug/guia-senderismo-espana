/* Allzone V16.4.2 - low-memory photo pipeline */
(function(){
'use strict';
if(window.AllzoneLowMemoryPhotos)return;
const VERSION='V16.4.2 · FOTOS MEMORIA BAJA';
const store=window.AllzoneV162?.photoStore;
if(!store)return;
let work=Promise.resolve();
let busy=false;
let pdfBlob=null,pdfName='';

const css=document.createElement('style');
css.textContent=`
.v1642-note{background:#eaf7f3;border:1px solid #c9e4dd;color:#174f46;border-radius:10px;padding:9px 10px;font:11px/1.4 Arial;margin:7px 0}.v1642-photo-status{font:10.5px/1.35 Arial;color:#566762;margin-top:5px}.v1642-photo-status.ok{color:#087f73;font-weight:800}.v1642-photo-status.busy{color:#8a6500}.v1642-photo-status.bad{color:#a32116}.v1642-actions{display:flex;gap:5px;flex-wrap:wrap}.v1642-actions label,.v1642-actions button{min-height:37px;padding:6px 8px;border-radius:9px;border:1px solid #bed0cc;background:#fff;color:#075f57;font:800 11px Arial}.v1642-actions input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.v1642-preview{display:block;width:100%;height:138px;object-fit:contain;background:#f4f7f6;border:1px solid #d7e0de;border-radius:9px;margin:5px 0}.v1642-empty{height:58px;display:grid;place-items:center;background:#f6f8f8;border:1px dashed #b7c4c1;border-radius:9px;color:#67736f;font-size:11px;margin:5px 0}.v1642-pdf{width:100%;min-height:43px;border-radius:10px;margin:5px 0;border:0;background:#087f73;color:#fff;font-weight:900;font-size:12px}.v1642-pdf.alt{background:#fff;color:#075f57;border:1px solid #b9cbc7}.v1642-pdf:disabled{opacity:.55}`;
document.head.appendChild(css);

function targets(){return typeof window.photoTargets==='function'?window.photoTargets():[];}
function fmt(n){if(!Number.isFinite(n))return '';return n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(1)+' MB';}
function revoke(rec){if(rec?.url)try{URL.revokeObjectURL(rec.url);}catch(_){}}
function resetPdf(){pdfBlob=null;pdfName='';}
function status(key,msg,cls=''){const n=document.querySelector(`[data-mem-status="${CSS.escape(key)}"]`);if(n){n.textContent=msg;n.className='v1642-photo-status '+cls;}}
function setPdfStatus(msg,bad=false){const n=document.getElementById('v1642PdfStatus');if(n){n.textContent=msg;n.className='v1642-photo-status '+(bad?'bad':'');}}
function jpegSize(buf){
  try{const v=new DataView(buf);if(v.getUint16(0,false)!==0xFFD8)return null;let p=2;while(p+9<v.byteLength){if(v.getUint8(p)!==0xFF){p++;continue;}const marker=v.getUint8(p+1);if(marker===0xD8||marker===0xD9){p+=2;continue;}if(p+4>v.byteLength)break;const len=v.getUint16(p+2,false);if([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF].includes(marker)){return {h:v.getUint16(p+5,false),w:v.getUint16(p+7,false)};}if(!len)break;p+=2+len;}return null;
  }catch(_){return null;}
}
async function getDims(file){
  if(/jpe?g/i.test(file.type)||/\.jpe?g$/i.test(file.name||'')){
    const head=await file.slice(0,512*1024).arrayBuffer();const d=jpegSize(head);if(d)return d;
  }
  return null;
}
function targetDims(w,h,max){const s=Math.min(1,max/Math.max(w,h));return {w:Math.max(1,Math.round(w*s)),h:Math.max(1,Math.round(h*s))};}
function canvasBlob(c,q){return new Promise((ok,fail)=>c.toBlob(b=>b?ok(b):fail(new Error('No se pudo comprimir la fotografia.')),'image/jpeg',q));}
async function compressPhoto(file,key){
  const max=/plate/i.test(key)?1600:1440,quality=/plate/i.test(key)?.78:.74;
  let dims=await getDims(file),bm=null;
  try{
    if(dims&&window.createImageBitmap){const t=targetDims(dims.w,dims.h,max);bm=await createImageBitmap(file,{imageOrientation:'from-image',resizeWidth:t.w,resizeHeight:t.h,resizeQuality:'high'});dims={w:bm.width,h:bm.height};}
    else if(window.createImageBitmap){bm=await createImageBitmap(file,{imageOrientation:'from-image'});const t=targetDims(bm.width,bm.height,max);if(t.w!==bm.width||t.h!==bm.height){const small=document.createElement('canvas');small.width=t.w;small.height=t.h;const sx=small.getContext('2d',{alpha:false});sx.fillStyle='#fff';sx.fillRect(0,0,t.w,t.h);sx.drawImage(bm,0,0,t.w,t.h);bm.close?.();const blob=await canvasBlob(small,quality);small.width=1;small.height=1;return blob;}dims={w:bm.width,h:bm.height};}
    else throw new Error('Este navegador no permite reducir la foto de forma segura.');
    const c=document.createElement('canvas');c.width=dims.w;c.height=dims.h;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);const blob=await canvasBlob(c,quality);c.width=1;c.height=1;return blob;
  }finally{bm?.close?.();}
}
function card(t){
  const rec=store.get(t.key);
  return `<section class="v162-photo-card" data-mem-card="${t.key}"><h3>${t.label}${t.required?' *':' (opcional)'}</h3>${rec?`<img class="v1642-preview" src="${rec.url}" alt="${t.label}">`:`<div class="v1642-empty">Sin fotografia</div>`}<div class="v1642-actions"><label>Camara<input type="file" accept="image/*" capture="environment" data-mem-input="${t.key}"></label><label>Biblioteca<input type="file" accept="image/*" data-mem-input="${t.key}"></label>${rec?`<button type="button" data-mem-remove="${t.key}">Quitar</button>`:''}</div><div data-mem-status="${t.key}" class="v1642-photo-status ${rec?'ok':''}">${rec?`Lista · ${fmt(rec.originalSize)} → ${fmt(rec.file.size)}`:'La foto se reducira automaticamente antes de guardarse.'}</div></section>`;
}
function replaceCard(key){const t=targets().find(v=>v.key===key),old=host.querySelector(`[data-mem-card="${CSS.escape(key)}"]`);if(!t||!old)return;const w=document.createElement('div');w.innerHTML=card(t);old.replaceWith(w.firstElementChild);bindCard(host.querySelector(`[data-mem-card="${CSS.escape(key)}"]`));}
function queuePhoto(file,key){
  work=work.then(async()=>{
    status(key,'Reduciendo fotografia para ahorrar memoria...','busy');
    try{
      const blob=await compressPhoto(file,key);const old=store.get(key);revoke(old);const url=URL.createObjectURL(blob);store.set(key,{file:blob,url,name:file.name||('foto-'+Date.now()+'.jpg'),type:'image/jpeg',originalSize:file.size});state[key+'_name']=file.name||'foto.jpg';resetPdf();replaceCard(key);
    }catch(err){status(key,(err?.message||'No se pudo cargar la foto.')+' Prueba a hacerla de nuevo.','bad');}
    finally{window.AllzoneTouchFix?.keepContinueLive?.();}
  });
}
function bindCard(root){
  if(!root)return;
  root.querySelectorAll('[data-mem-input]').forEach(inp=>inp.onchange=()=>{const f=inp.files?.[0];inp.value='';if(!f)return;if(f.size===0){status(inp.dataset.memInput,'La foto esta vacia. Hazla de nuevo.','bad');return;}queuePhoto(f,inp.dataset.memInput);});
  root.querySelectorAll('[data-mem-remove]').forEach(b=>b.onclick=()=>{const k=b.dataset.memRemove;revoke(store.get(k));store.delete(k);delete state[k+'_name'];resetPdf();replaceCard(k);});
}
window.photoScreen=function(){host.innerHTML=`<div class="eyebrow">Evidencias</div><h1>Fotografias del accidente</h1><p class="lead">Modo memoria baja: cada fotografia se reduce antes de guardarse para evitar bloqueos del movil.</p><div class="v1642-note"><b>Optimizado para movil:</b> solo se procesa una foto cada vez y la imagen original se libera de memoria al terminar.</div>${targets().map(card).join('')}<div class="card"><button type="button" class="v1642-pdf" id="v1642Download">DESCARGAR FOTOS EN PDF</button><button type="button" class="v1642-pdf alt" id="v1642Share">COMPARTIR PDF · WHATSAPP</button><div id="v1642PdfStatus" class="v1642-photo-status"></div></div>`;host.querySelectorAll('[data-mem-card]').forEach(bindCard);document.getElementById('v1642Download').onclick=()=>exportPdf(false);document.getElementById('v1642Share').onclick=()=>exportPdf(true);};

function blobBytes(b){return b.arrayBuffer().then(a=>new Uint8Array(a));}
function makePdf(pages){
  const enc=new TextEncoder(),parts=[],off=[0];let len=0;const wr=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length;};const obj=(id,body)=>{off[id]=len;wr(id+' 0 obj\n'+body+'\nendobj\n');};wr('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');pages.forEach((p,i)=>{const id=3+i*3;obj(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im '+(id+2)+' 0 R >> >> /Contents '+(id+1)+' 0 R >>');const c='q\n595 0 0 842 0 0 cm\n/Im Do\nQ\n';obj(id+1,'<< /Length '+enc.encode(c).length+' >>\nstream\n'+c+'endstream');off[id+2]=len;wr((id+2)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n');wr(p.bytes);wr('\nendstream\nendobj\n');});const xr=len,n=3+pages.length*3;wr('xref\n0 '+n+'\n0000000000 65535 f \n');for(let i=1;i<n;i++)wr(String(off[i]).padStart(10,'0')+' 00000 n \n');wr('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF\n');return new Blob(parts,{type:'application/pdf'});
}
async function buildPdf(){
  if(pdfBlob)return {blob:pdfBlob,name:pdfName};const ts=targets().filter(t=>store.has(t.key));if(!ts.length)throw new Error('No hay fotografias para generar el PDF.');const pages=[];
  for(let i=0;i<ts.length;i+=2){const group=ts.slice(i,i+2),page=Math.floor(i/2)+1,total=Math.ceil(ts.length/2);setPdfStatus(`Generando PDF · pagina ${page} de ${total}...`);const c=document.createElement('canvas');c.width=900;c.height=1273;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#087f73';x.fillRect(0,0,c.width,10);x.fillStyle='#12322d';x.font='900 28px Arial';x.fillText('ALLZONE LOGISTICS',50,45);x.font='900 29px Arial';x.fillText('Anexo fotografico del accidente',50,86);x.fillStyle='#536460';x.font='18px Arial';x.fillText(`${state.acc_date||''} ${state.acc_time||''} · A ${state.a_plate||''} · B ${state.b_plate||''}`,50,126);let y=175;for(const t of group){x.strokeStyle='#cbd6d3';x.strokeRect(46,y,808,492);x.fillStyle='#eaf4f1';x.fillRect(47,y+1,806,42);x.fillStyle='#173c34';x.font='800 19px Arial';x.fillText(t.label,63,y+12);const rec=store.get(t.key);let bm=await createImageBitmap(rec.file);try{const sc=Math.min(750/bm.width,400/bm.height),w=bm.width*sc,h=bm.height*sc;x.drawImage(bm,75+(750-w)/2,y+59+(400-h)/2,w,h);}finally{bm.close?.();}x.fillStyle='#61716c';x.font='14px Arial';x.fillText(`${rec.name} · ${fmt(rec.file.size)}`,63,y+462);y+=525;await new Promise(r=>setTimeout(r,0));}const jpg=await canvasBlob(c,.80);pages.push({w:c.width,h:c.height,bytes:await blobBytes(jpg)});c.width=1;c.height=1;await new Promise(r=>setTimeout(r,0));}
  pdfBlob=makePdf(pages);pdfName=`FOTOS_ALLZONE_${String(state.a_plate||'A').replace(/[^A-Za-z0-9_-]/g,'_')}_${String(state.b_plate||'B').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;return {blob:pdfBlob,name:pdfName};
}
async function exportPdf(share){if(busy)return;busy=true;try{const {blob,name}=await buildPdf();setPdfStatus(`PDF listo · ${fmt(blob.size)}.`);if(share){const f=new File([blob],name,{type:'application/pdf'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[f]}))){try{await navigator.share({title:'Fotos accidente Allzone',files:[f]});return;}catch(e){if(e?.name==='AbortError')return;}}}const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);if(share)setPdfStatus('PDF descargado. En WhatsApp usa clip/+ → Documento para adjuntarlo.');}catch(err){setPdfStatus(err?.message||'No se pudo generar el PDF.',true);}finally{busy=false;window.AllzoneTouchFix?.keepContinueLive?.();}}

if(window.AllzoneV162)window.AllzoneV162.buildPhotoPdf=buildPdf;
const priorReview=window.reviewScreen;
window.reviewScreen=function(){priorReview?.();setTimeout(()=>{const d=document.getElementById('v162PhotosDownload'),s=document.getElementById('v162PhotosShare');if(d)d.onclick=()=>exportPdf(false);if(s)s.onclick=()=>exportPdf(true);},0);};
const priorRender=window.render;
window.render=function(){priorRender();const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;document.title='Allzone '+VERSION;window.AllzoneTouchFix?.keepContinueLive?.();};
window.AllzoneLowMemoryPhotos={version:VERSION,compressPhoto,buildPdf,store};
window.render();
})();