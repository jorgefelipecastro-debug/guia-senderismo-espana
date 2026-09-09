/* Allzone trial V15.2: scoped validation and lossless mobile navigation. */
(function () {
  'use strict';
  if (window.AllzoneNavigation) return;
  const VERSION = 'V15.2 - CONTINUAR CORREGIDO';
  const previousRender = window.render;
  const photoValidation = window.validateStep;
  let moving = false;
  const hostFields = () => [...host.querySelectorAll('input[data-field],select[data-field],textarea[data-field]')];
  const style = document.createElement('style');
  style.textContent = `
    .footerbar{flex-wrap:wrap}.footerbar>button{min-height:48px}
    #navigationMessage{flex:0 0 100%;font:700 13px/1.4 Arial;background:#fff2ef;color:#972d20;border:1px solid #e6ac9f;border-radius:9px;padding:10px;margin:0;overflow-wrap:anywhere}
    #navigationMessage[hidden]{display:none}.field [aria-invalid=true]{border:2px solid #b42318!important;background:#fffafa!important}
    .field{scroll-margin-top:105px;scroll-margin-bottom:160px}.field-error{color:#a32116;font:13px/1.4 Arial;margin:6px 0 0}
    .screen{padding-bottom:180px}.choice[role=button]:focus-visible{outline:3px solid #087f73;outline-offset:3px}
  `;
  document.head.appendChild(style);
  const msg = document.createElement('div');
  msg.id = 'navigationMessage'; msg.setAttribute('role','alert'); msg.setAttribute('aria-live','assertive'); msg.hidden = true;
  nextBtn.parentElement.prepend(msg);
  nextBtn.type = 'button'; backBtn.type = 'button';
  function announce(text) { msg.textContent = text; msg.hidden = false; }
  function clearErrors() {
    msg.hidden = true; msg.textContent = '';
    host.querySelectorAll('[aria-invalid=true]').forEach(n => n.removeAttribute('aria-invalid'));
    host.querySelectorAll('.field-error').forEach(n => n.remove());
  }
  function label(el) {
    return el.closest('.field')?.querySelector('label')?.textContent.trim() || el.getAttribute('aria-label') || el.dataset.field || 'Dato';
  }
  // Native mobile pickers, autofill and speech input may complete on change.
  // Read the actual controls before any screen replacement, not just cached state.
  window.sync = function () {
    hostFields().forEach(el => {
      state[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value;
    });
  };
  function bindFields() {
    hostFields().forEach((el, i) => {
      if (!el.id) el.id = 'azField_' + el.dataset.field;
      const l = el.closest('.field')?.querySelector('label'); if (l) l.htmlFor = el.id;
      if (el.required && l && !l.querySelector('[data-required-mark]')) {
        const mark=document.createElement('span');mark.dataset.requiredMark='1';mark.textContent=' *';l.append(mark);
      }
      const remember = () => {
        state[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value;
        el.removeAttribute('aria-invalid');el.closest('.field')?.querySelector('.field-error')?.remove();
      };
      el.oninput = remember; el.onchange = remember;
    });
  }
  // Restrict bindings to the active screen. The hidden DAA uses data-yn too.
  window.bindBasic = function () {
    bindFields();
    host.querySelectorAll('[data-choice]').forEach(el => {
      el.setAttribute('role','button');el.tabIndex=0;
      el.onclick = () => { sync(); state[el.dataset.choice] = el.dataset.value; render(); };
      el.onkeydown = ev => { if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();el.click();} };
    });
    host.querySelectorAll('button[data-yn][data-value]').forEach(el => {
      el.type='button';el.setAttribute('aria-pressed',String(state[el.dataset.yn]===el.dataset.value));
      el.onclick=()=>{sync();state[el.dataset.yn]=el.dataset.value;render();};
    });
  };
  function invalid(el, text) {
    el.setAttribute('aria-invalid','true');
    const box=el.closest('.field')||el.parentElement;
    const n=document.createElement('div');n.className='field-error';n.textContent=text;box.appendChild(n);
  }
  window.validateStep = function () {
    clearErrors(); sync();
    if (window.AllzonePhotoPdf && !window.AllzonePhotoPdf.ready()) {
      announce('Espera a que termine la carga del borrador o de las fotos.'); return false;
    }
    const problems=[];
    hostFields().filter(el=>!el.disabled&&el.type!=='hidden').forEach(el=>{
      let text='';
      const value=String(el.value||'').trim();
      if(el.required && (el.type==='checkbox'?!el.checked:!value)) text='Completa '+label(el).replace(/\s*\*$/, '')+'.';
      else if(value && el.validity && !el.validity.valid) text='Revisa el formato de '+label(el).replace(/\s*\*$/, '')+'.';
      if(text){invalid(el,text);problems.push({el,text});}
    });
    if(problems.length){
      announce(problems.map(p=>p.text).join(' '));
      const first=problems[0].el;first.closest('details')?.setAttribute('open','');
      first.focus({preventScroll:true});first.scrollIntoView({block:'center',behavior:'auto'});
      return false;
    }
    const step=getSteps()[idx];
    if(step.title==='Tipo A'||step.title==='Tipo B'){
      const side=step.title.endsWith('A')?'a':'b';
      if(!state[side+'_vehicle_type']){announce('Selecciona Moto, Coche o Cami\u00f3n para el veh\u00edculo '+side.toUpperCase()+'.');return false;}
    }
    if(step.title==='N\u00famero veh\u00edculos adicionales'){
      const n=Number(state.additional_vehicle_count);
      if(!Number.isInteger(n)||n<1||n>20){announce('Indica entre 1 y 20 veh\u00edculos adicionales.');return false;}
      ensureExtraDefaults();
    }
    // Preserve the photo module's real-image checks and pending-work protection.
    if(step.title==='Fotos' && !photoValidation()){
      announce('A\u00f1ade las fotos del da\u00f1o y de la matr\u00edcula de cada veh\u00edculo y espera a ver las miniaturas.');return false;
    }
    return true;
  };
  function decorate() {
    const banner=document.querySelector('.v15-banner');
    if(banner)banner.textContent=VERSION;
    else if(!document.getElementById('azNavigationVersion')){
      const b=document.createElement('div');b.id='azNavigationVersion';b.className='v15-banner';b.textContent=VERSION;
      b.style.cssText='background:#075f57;color:white;padding:8px;text-align:center;font:700 12px Arial';document.querySelector('.shell').prepend(b);
    }
    bindBasic();
    const place=host.querySelector('[data-field="acc_place"]');
    if(place){
      place.placeholder='Calle, n\u00famero y localidad, o carretera y punto kilom\u00e9trico';
      const gps=document.getElementById('gpsPlaceStatus');
      if(gps&&!gps.classList.contains('ok')&&!gps.classList.contains('err'))gps.textContent='Puedes escribir el lugar o usar la br\u00fajula. El GPS no es obligatorio.';
    }
    const n=idx+1;nextBtn.setAttribute('aria-label',idx===getSteps().length-1?'Ver parte':'Continuar desde el paso '+n);
    document.title='Allzone - V15.2 - Parte de accidente';
  }
  window.render = function () { clearErrors(); previousRender(); decorate(); };
  function transition(delta) {
    if(moving)return;
    if(delta>0&&!validateStep())return;
    if(delta<0)sync();
    if(delta>0&&idx===getSteps().length-1){openDaaDocument();return;}
    const from=idx;moving=true;
    try { idx=Math.max(0,Math.min(getSteps().length-1,idx+delta));render(); }
    catch(err){
      console.error('Allzone navigation failed',err);idx=from;
      try{render();}catch(_){}
      announce('No se pudo abrir el siguiente paso. Tus datos siguen en el formulario. Vuelve a pulsar Continuar.');
    } finally { moving=false; }
  }
  nextBtn.onclick=ev=>{ev.preventDefault();transition(1);};
  backBtn.onclick=ev=>{ev.preventDefault();transition(-1);};
  window.AllzoneNavigation={version:VERSION,validate:()=>validateStep(),step:()=>({index:idx,title:getSteps()[idx].title})};
  // Bind the current screen without replacing the user's fields or photo nodes.
  sync();decorate();
})();
