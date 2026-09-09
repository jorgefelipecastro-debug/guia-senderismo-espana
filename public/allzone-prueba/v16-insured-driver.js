/* Allzone V16.4.5 - insured B is also driver B */
(function(){
'use strict';
if(window.AllzoneInsuredDriverB)return;
const VERSION='V16.4.5 · ASEGURADO B = CONDUCTOR B';

function mirrorB(){
  state.b_driver_name=state.b_insured_name||'';
  state.b_driver_surname=state.b_insured_surname||'';
  state.b_driver_address=state.b_insured_address||'';
  state.b_driver_country=state.b_insured_country||'';
  state.b_driver_contact=state.b_insured_contact||'';
  state.b_driver_birth='';
  state.b_license='';
  state.b_license_category='';
  state.b_license_until='';
}

const originalGetSteps=window.getSteps;
window.getSteps=function(){
  const steps=originalGetSteps();
  return steps.filter(s=>s.title!=='Conductor B');
};

const originalSync=window.sync;
window.sync=function(){
  if(typeof originalSync==='function')originalSync();
  mirrorB();
};

const originalPrepPrint=window.prepPrint;
window.prepPrint=function(){
  mirrorB();
  return originalPrepPrint?.();
};

function decorateInsuredB(){
  const title=window.getSteps?.()[idx]?.title||'';
  if(title!=='Asegurado B')return;
  const lead=host.querySelector('p.lead');
  if(lead)lead.textContent='Rellena solo los datos del asegurado y del vehículo B. Estos datos se usarán también como datos del conductor B en el parte final.';
  if(!host.querySelector('.v1645-note')){
    const card=host.querySelector('.card');
    if(card){
      const note=document.createElement('div');
      note.className='v1645-note';
      note.innerHTML='<b>No hay que rellenar el conductor B por separado.</b> Se considera que el asegurado es también quien conduce el vehículo B.';
      card.insertAdjacentElement('beforebegin',note);
    }
  }
}

const css=document.createElement('style');
css.textContent='.v1645-note{margin:7px 0;padding:9px 10px;border:1px solid #c9e4dd;border-radius:10px;background:#eaf7f3;color:#174f46;font:11px/1.4 Arial}';
document.head.appendChild(css);

const originalRender=window.render;
window.render=function(){
  mirrorB();
  originalRender();
  decorateInsuredB();
  const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;
  document.title='Allzone '+VERSION;
  window.AllzoneTouchFix?.keepContinueLive?.();
};

mirrorB();
window.AllzoneInsuredDriverB={version:VERSION,mirrorB};
window.render();
})();