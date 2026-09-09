/* Allzone V16.3 - final PDF preview on screen 17/final review */
(function(){
'use strict';
if(window.AllzonePdfPreview)return;
const VERSION='V16.3 - VISTA PREVIA PDF FINAL';
let libsPromise=null;
let currentUrl='';
let currentBlob=null;
let busy=false;

const css=document.createElement('style');
css.textContent=`
.v163-card{border:1px solid #dbe5e2;border-radius:16px;background:#fff;padding:14px;margin:14px 0}.v163-card h2{margin:0 0 7px;font-size:18px}.v163-card p{font-size:13px;line-height:1.45;color:#5d6966}.v163-actions{display:grid;gap:9px}.v163-btn{min-height:48px;border-radius:11px;border:0;background:#087f73;color:#fff;font-weight:900;font-size:14px;padding:11px 13px}.v163-btn.alt{background:#fff;color:#075f57;border:1px solid #b9cbc7}.v163-btn:disabled{opacity:.55}.v163-status{font-size:13px;line-height:1.45;color:#4d625d;margin-top:8px}.v163-status.bad{color:#a32116}.v163-preview-wrap{display:none;margin-top:12px;border:1px solid #cfd9d6;border-radius:12px;overflow:hidden;background:#f2f5f4}.v163-preview-wrap.open{display:block}.v163-preview{width:100%;height:68vh;min-height:520px;border:0;background:#fff}.v163-fallback{padding:14px;font-size:12px;color:#5f6c68}.v16-banner{background:#075f57!important}`;
document.head.appendChild(css);
const banner=document.querySelector('.v16-banner');if(banner)banner.textContent=VERSION;

function setStatus(msg,bad=false){const n=document.getElementById('v163Status');if(n){n.textContent=msg||'';n.className='v163-status'+(bad?' bad':'');}}
function setButtons(disabled){document.querySelectorAll('[data-v163-action]').forEach(b=>b.disabled=disabled);}
function loadScript(src,test){return new Promise((ok,fail)=>{if(test())return ok();const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>test()?ok():fail(new Error('La libreria PDF no se ha iniciado.'));s.onerror=()=>fail(new Error('No se pudo cargar el generador PDF.'));document.head.appendChild(s);});}
function loadLibs(){
 if(libsPromise)return libsPromise;
 libsPromise=loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>typeof window.html2canvas==='function')
   .then(()=>loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF));
 return libsPromise;
}
function revoke(){if(currentUrl){try{URL.revokeObjectURL(currentUrl);}catch(_){ }currentUrl='';}currentBlob=null;}
function preparePrintClone(){
  if(typeof sync==='function')sync();
  if(typeof prepPrint!=='function')throw new Error('No se puede preparar el documento final.');
  prepPrint();
  const src=document.getElementById('daaPrint');if(!src)throw new Error('No se encuentra el documento final.');
  const clone=src.cloneNode(true);clone.id='v163PdfSource';clone.style.display='block';clone.style.position='fixed';clone.style.left='-12000px';clone.style.top='0';clone.style.width='210mm';clone.style.background='#fff';clone.style.zIndex='-10';clone.style.pointerEvents='none';document.body.appendChild(clone);
  return clone;
}
function pageNodes(root){
  const pages=[];
  const main=root.querySelector('.daa-sheet');if(main)pages.push(main);
  root.querySelectorAll('.property-annex').forEach(n=>pages.push(n));
  root.querySelectorAll('.extra-daa').forEach(n=>{if(!pages.includes(n))pages.push(n)});
  const annex=root.querySelector('.annex');if(annex)pages.push(annex);
  return pages;
}
async function buildPdfBlob(){
  busy=true;setButtons(true);setStatus('Generando vista previa del PDF...');
  let root;
  try{
    await loadLibs();
    root=preparePrintClone();
    const pages=pageNodes(root);if(!pages.length)throw new Error('No hay paginas para generar el PDF.');
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    for(let i=0;i<pages.length;i++){
      setStatus(`Generando PDF · pagina ${i+1} de ${pages.length}...`);
      const canvas=await window.html2canvas(pages[i],{scale:1.15,backgroundColor:'#ffffff',useCORS:true,logging:false,imageTimeout:12000});
      const img=canvas.toDataURL('image/jpeg',0.9);if(i>0)pdf.addPage('a4','portrait');pdf.addImage(img,'JPEG',0,0,210,297,undefined,'FAST');canvas.width=1;canvas.height=1;await new Promise(r=>setTimeout(r,0));
    }
    revoke();currentBlob=pdf.output('blob');currentUrl=URL.createObjectURL(currentBlob);setStatus(`PDF listo · ${pages.length} pagina(s) · ${(currentBlob.size/1024/1024).toFixed(2)} MB.`);return currentBlob;
  }catch(err){setStatus(err.message||'No se pudo generar el PDF.',true);throw err;
  }finally{root?.remove();busy=false;setButtons(false);}
}
async function ensurePdf(){if(currentBlob)return currentBlob;return buildPdfBlob();}
function filename(){return `PARTE_ALLZONE_${String(state.a_plate||'A').replace(/[^A-Za-z0-9_-]/g,'_')}_${String(state.b_plate||'B').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;}
async function showPreview(){
 try{await ensurePdf();const wrap=document.getElementById('v163PreviewWrap'),frame=document.getElementById('v163Preview');if(wrap&&frame){frame.src=currentUrl+'#toolbar=1&navpanes=0&view=FitH';wrap.classList.add('open');wrap.scrollIntoView({behavior:'smooth',block:'start'});}}
 catch(_){fallbackPrintPreview();}
}
async function downloadPdf(){try{const blob=await ensurePdf();const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}catch(_){fallbackPrintPreview();}}
function fallbackPrintPreview(){
 try{if(typeof sync==='function')sync();if(typeof prepPrint==='function')prepPrint();const node=document.getElementById('daaPrint');const win=window.open('','_blank');if(!win){window.print();return;}const styles=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');win.document.open();win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Vista previa PDF · Allzone</title><style>${styles}</style></head><body><div id="daaPrint" style="display:block">${node.innerHTML}</div><script>setTimeout(()=>window.print(),450)<\/script></body></html>`);win.document.close();}catch(err){alert('No se pudo abrir la vista previa del documento.');}
}
function controls(){return `<section class="v163-card" id="v163PdfCard"><h2>Documento final en PDF</h2><p>Comprueba el parte antes de descargarlo. La vista previa se genera solo al pulsar el boton, para que el cambio entre pantallas siga siendo rapido.</p><div class="v163-actions"><button type="button" class="v163-btn" data-v163-action id="v163PreviewBtn">VISTA PREVIA DEL PDF</button><button type="button" class="v163-btn alt" data-v163-action id="v163DownloadBtn">DESCARGAR PDF FINAL</button></div><div id="v163Status" class="v163-status"></div><div id="v163PreviewWrap" class="v163-preview-wrap"><iframe id="v163Preview" class="v163-preview" title="Vista previa PDF del parte final"></iframe><div class="v163-fallback">Si el navegador del movil no muestra el PDF dentro de esta ventana, pulsa “Descargar PDF final” o vuelve a “Vista previa del PDF” para abrir el visor del sistema.</div></div></section>`;}
function inject(){
  const title=getSteps?.()[idx]?.title||'';
  if(title!=='Entrega'&&title!=='Revisión')return;
  if(document.getElementById('v163PdfCard'))return;
  host.insertAdjacentHTML('beforeend',controls());
  document.getElementById('v163PreviewBtn').onclick=showPreview;document.getElementById('v163DownloadBtn').onclick=downloadPdf;
}
const priorRender=window.render;
window.render=function(){revoke();priorRender();const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;document.title='Allzone '+VERSION;setTimeout(inject,0);};
const priorReview=window.reviewScreen;
window.reviewScreen=function(){priorReview?.();setTimeout(inject,0);};
window.addEventListener('pagehide',revoke);
window.AllzonePdfPreview={version:VERSION,buildPdfBlob,showPreview,downloadPdf};
window.render();
})();