/* Allzone V16.4.6 - send final one-page DAA to Fleet + counterpart */
(function(){
'use strict';
if(window.AllzoneClaimEmail)return;
const VERSION='V16.4.6 · ENVIO FINAL A FLOTA + CONTRARIO';
const FLEET='flota@allzonelogistics.com';
let sending=false;
let sent={fleet:false,counterpart:false};
let claimId='';

const css=document.createElement('style');
css.textContent=`
.v1646-send{margin:10px 0;padding:12px;border:1px solid #cfe0dc;border-radius:12px;background:#fff}.v1646-send h3{margin:0 0 7px;font-size:15px}.v1646-recipient{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #edf1f0;font-size:12px}.v1646-recipient:last-of-type{border-bottom:0}.v1646-recipient b{color:#24443e}.v1646-recipient span{text-align:right;overflow-wrap:anywhere}.v1646-status{margin-top:8px;font-size:12px;line-height:1.45}.v1646-status.ok{color:#087f73;font-weight:800}.v1646-status.bad{color:#a32116;font-weight:800}.v1646-finish{width:100%;min-height:49px;border:0;border-radius:11px;background:#087f73;color:#fff;font-size:14px;font-weight:900;margin-top:9px}.v1646-finish:disabled{opacity:.55}`;
document.head.appendChild(css);

function safe(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function currentTitle(){return window.getSteps?.()[idx]?.title||'';}
function ensureClaimId(){if(claimId)return claimId;claimId='az-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);return claimId;}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());}
function status(msg,cls=''){const n=document.getElementById('v1646Status');if(n){n.textContent=msg;n.className='v1646-status '+cls;}}
function setBusy(v){sending=v;const b=document.getElementById('v1646Finish');if(b)b.disabled=v;if(window.nextBtn&&currentTitle()==='Revisión')window.nextBtn.disabled=v;}

function decorateDelivery(){
  if(currentTitle()!=='Entrega')return;
  const fields=[...host.querySelectorAll('[data-field]')];
  const aCopy=fields.find(el=>el.dataset.field==='a_copy_email');
  aCopy?.closest('.field')?.remove();
  const lead=host.querySelector('p.lead');if(lead)lead.textContent='Indica el correo del contrario. Al terminar, la misma copia del parte se enviará automáticamente a Flota y al vehículo B.';
  const fixed=[...host.querySelectorAll('.fixed')].find(n=>String(n.textContent).toLowerCase().includes('flota@'));
  if(fixed){fixed.textContent=FLEET;fixed.setAttribute('aria-label','Correo fijo del departamento de Flota');}
}

function panel(){
  const mail=state.b_copy_email||'';
  return `<section class="v1646-send"><h3>Envío automático del parte</h3><div class="v1646-recipient"><b>Flota</b><span>${FLEET}${sent.fleet?' · ✓ enviado':''}</span></div><div class="v1646-recipient"><b>Vehículo B</b><span>${safe(mail)||'Correo pendiente'}${sent.counterpart?' · ✓ enviado':''}</span></div><button type="button" id="v1646Finish" class="v1646-finish">${sent.fleet&&sent.counterpart?'PARTE ENVIADO':'TERMINAR Y ENVIAR PARTE'}</button><div id="v1646Status" class="v1646-status">Se enviará exactamente el mismo PDF de una página a ambos destinatarios. Las fotos no se adjuntan.</div></section>`;
}
function decorateReview(){
  if(currentTitle()!=='Revisión')return;
  if(!document.getElementById('v1646Finish'))host.insertAdjacentHTML('beforeend',panel());
  const b=document.getElementById('v1646Finish');if(b)b.onclick=()=>sendFinal();
  if(window.nextBtn){window.nextBtn.textContent=sent.fleet&&sent.counterpart?'ENVIADO':'TERMINAR Y ENVIAR';window.nextBtn.onclick=()=>sendFinal();window.nextBtn.disabled=sending||Boolean(sent.fleet&&sent.counterpart);}
}

async function sendTarget(target,pdf,filename){
  const fd=new FormData();
  fd.append('pdf',pdf,filename);
  fd.append('filename',filename);
  fd.append('counterpart_email',String(state.b_copy_email||'').trim());
  fd.append('target',target);
  fd.append('claim_id',ensureClaimId());
  fd.append('a_plate',state.a_plate||'');fd.append('b_plate',state.b_plate||'');fd.append('acc_date',state.acc_date||'');fd.append('acc_time',state.acc_time||'');fd.append('acc_place',state.acc_place||'');
  const r=await fetch('/api/allzone/send-claim',{method:'POST',body:fd,cache:'no-store'});
  let data={};try{data=await r.json();}catch(_){ }
  if(!r.ok&&r.status!==207)throw new Error(data.error||'No se pudo enviar el correo.');
  return data;
}

async function sendFinal(){
  if(sending||sent.fleet&&sent.counterpart)return;
  if(typeof window.sync==='function')window.sync();
  const mail=String(state.b_copy_email||'').trim();
  if(!validEmail(mail)){status('Escribe un correo válido del contrario antes de enviar.','bad');const el=host.querySelector('[data-field="b_copy_email"]');el?.focus();return;}
  if(!window.AllzonePdfPreview?.buildPdfBlob){status('No está disponible el generador del PDF final.','bad');return;}
  setBusy(true);
  try{
    status('Generando el PDF final de una página...');
    const pdf=await window.AllzonePdfPreview.buildPdfBlob();
    const filename=`PARTE_ALLZONE_${String(state.a_plate||'A').replace(/[^A-Za-z0-9_-]/g,'_')}_${String(state.b_plate||'B').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;
    if(!sent.fleet){status('Enviando copia a Flota...');const r=await sendTarget('fleet',pdf,filename);sent.fleet=Boolean(r?.results?.fleet?.ok);}
    if(!sent.counterpart){status('Enviando copia al correo del vehículo B...');const r=await sendTarget('counterpart',pdf,filename);sent.counterpart=Boolean(r?.results?.counterpart?.ok);}
    if(sent.fleet&&sent.counterpart){status('✓ Parte enviado correctamente a Flota y al vehículo B.','ok');}
    else status(`Estado: ${sent.fleet?'✓ Flota':'✗ Flota'} · ${sent.counterpart?'✓ Vehículo B':'✗ Vehículo B'}. Pulsa de nuevo para reintentar solo el pendiente.`,'bad');
  }catch(err){status(err?.message||'No se pudo completar el envío. Pulsa de nuevo para reintentar.','bad');}
  finally{setBusy(false);decorateReview();window.AllzoneTouchFix?.keepContinueLive?.();}
}

const priorRender=window.render;
window.render=function(){priorRender();decorateDelivery();decorateReview();const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;document.title='Allzone '+VERSION;};

window.AllzoneClaimEmail={version:VERSION,sendFinal,get sent(){return {...sent}}};
window.render();
})();