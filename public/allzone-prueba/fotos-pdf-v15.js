/* Allzone trial V15. Photographs are embedded in a real PDF; no WhatsApp deep links. */
(function () {
  'use strict';
  const VERSION = 'V15.1 - FOTOS EN PDF';
  const photos = new Map(), errors = new Map();
  let queue = Promise.resolve(), pending = 0, busy = false, lastUrl = '', lastName = '';
  let db = null, saveTimer = null, restoring = true;
  const TTL = 24 * 60 * 60 * 1000;
  const css = `
  .v15-banner{background:#075f57;color:white;padding:8px 14px;text-align:center;font:700 12px Arial;letter-spacing:.03em}
  .v15-card{border:1px solid #d9e3e2;border-radius:16px;background:white;padding:15px;margin:14px 0}
  .v15-card h2{font-size:18px;margin:0 0 6px}.v15-meta{font-size:13px;color:#536361;line-height:1.45;margin:6px 0 12px}
  .v15-shot{border-top:1px solid #e7edec;margin-top:12px;padding-top:12px}.v15-shot h3{font-size:15px;margin:0 0 9px}
  .v15-preview{display:block;width:100%;height:190px;object-fit:contain;background:#f4f7f6;border:1px solid #d9e3e2;border-radius:10px;margin:10px 0}
  .v15-empty{border:1px dashed #bbc8c6;padding:16px;border-radius:10px;color:#5d6e6a;font-size:13px;margin:10px 0;text-align:center}
  .v15-actions{display:flex;flex-wrap:wrap;gap:8px}.v15-actions label,.v15-actions button,.v15-btn,.v15-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 14px;border:1px solid #bfd0cc;border-radius:11px;background:#fff;color:#075f57;font:700 14px Arial;text-decoration:none;cursor:pointer}
  .v15-actions input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}.v15-btn{background:#087f73;color:#fff;width:100%;border:0;margin:8px 0}
  .v15-btn:disabled{background:#889b97;cursor:wait}.v15-status{font:13px/1.45 Arial;color:#155e55;margin:8px 0;overflow-wrap:anywhere}.v15-error{color:#b42318}
  .v15-how{background:#eaf7f3;padding:13px;border-radius:11px;color:#194e45;font-size:14px;line-height:1.5}
  .v15-warning{padding:10px;border:1px solid #e6cd91;background:#fff9ed;font-size:12px;line-height:1.4;border-radius:9px}
  .v15-output{display:flex;flex-direction:column;gap:10px;margin:12px 0}.v15-output a{overflow-wrap:anywhere}.v15-photo-print{page-break-inside:avoid;break-inside:avoid;padding:5mm;border:1px solid #bbb;margin:4mm 0}
  .v15-photo-print img{display:block;max-width:170mm;max-height:94mm;object-fit:contain;margin:3mm auto}
  @media print{.v15-banner{display:none!important}#daaPrint .annex{display:block!important;height:auto!important;min-height:0!important;page-break-before:always}.v15-photo-print{break-inside:avoid}}
  `;
  document.querySelector('style').textContent += css;
  const banner = document.createElement('div'); banner.className = 'v15-banner'; banner.textContent = VERSION;
  document.querySelector('.shell').prepend(banner);
  const e = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const targets = () => photoTargets();
  const status = (message, bad) => { const n = document.getElementById('v15Status'); if(n){n.textContent=message;n.className='v15-status'+(bad?' v15-error':'');} };
  const selected = () => targets().filter(t => photos.has(t.key));
  function refreshBusy(){
    const gen = document.getElementById('downloadPhotosPdf');
    if(gen){gen.disabled=restoring||busy||pending>0||selected().length===0;gen.textContent=busy?'Generando PDF con las fotos...':pending?'Procesando fotograf\u00edas...':'DESCARGAR FOTOS EN PDF';}
    if(nextBtn) nextBtn.disabled=restoring||busy||pending>0;
  }
  function dirty(){
    if(lastUrl){URL.revokeObjectURL(lastUrl);lastUrl='';lastName='';}
    const box=document.getElementById('v15Output');if(box)box.replaceChildren();
    scheduleSave();
  }
  function scheduleSave(){if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,180);}
  async function saveDraft(){
    if(!db)return;
    try{
      const copy=JSON.parse(JSON.stringify(state));
      Object.keys(copy).filter(k=>k.endsWith('_data')).forEach(k=>delete copy[k]);
      const tx=db.transaction('draft','readwrite');
      tx.objectStore('draft').put({at:Date.now(),step:idx,state:copy,photos:[...photos]},'current');
      tx.onerror=()=>{const el=document.getElementById('v15LocalNote');if(el)el.textContent='No se pudo guardar el borrador local. Descarga el PDF antes de cerrar la pesta\u00f1a.';};
    }catch(_){/* In-memory photographs remain usable if storage is unavailable. */}
  }
  function imageFrom(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Este navegador no puede leer esta imagen. Haz otra foto o selecciona una imagen JPG, PNG o WebP.'));im.src=src;});}
  function blobData(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('No se pudo leer la fotograf\u00eda.'));r.readAsDataURL(blob);});}
  function canvasBlob(c,q=.87){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo preparar la imagen.')),'image/jpeg',q));}
  async function normalize(file){
    if(!file||file.size===0)throw new Error('La fotograf\u00eda est\u00e1 vac\u00eda.');
    if(file.size>45*1024*1024)throw new Error('La imagen supera 45 MB. Elige una copia JPG de menor tama\u00f1o.');
    const url=URL.createObjectURL(file);let im;
    try{im=await imageFrom(url);}finally{URL.revokeObjectURL(url);}
    if(!im.naturalWidth||!im.naturalHeight)throw new Error('La imagen no tiene dimensiones v\u00e1lidas.');
    const scale=Math.min(1,1800/Math.max(im.naturalWidth,im.naturalHeight));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*scale));c.height=Math.max(1,Math.round(im.naturalHeight*scale));
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
    let blob=await canvasBlob(c);if(blob.size>1800000)blob=await canvasBlob(c,.72);
    const result={data:await blobData(blob),width:c.width,height:c.height,size:blob.size,name:file.name};c.width=1;c.height=1;return result;
  }
  function shot(t){
    const p=photos.get(t.key);
    return `<div class="v15-shot" data-shot="${t.key}"><h3>${e(t.label)}${t.required?' *':' (opcional)'}</h3><div id="v15Preview_${t.key}">${p?`<img class="v15-preview" src="${p.data}" alt="${e(t.label)}">`:'<div class="v15-empty">Sin fotograf\u00eda: usa C\u00e1mara o Biblioteca.</div>'}</div><div class="v15-actions"><label>C\u00e1mara<input type="file" accept="image/*" capture="environment" data-v15-photo="${t.key}" data-source="camera" aria-label="C\u00e1mara: ${e(t.label)}"></label><label>Biblioteca<input type="file" accept="image/*" data-v15-photo="${t.key}" data-source="library" aria-label="Biblioteca: ${e(t.label)}"></label><button type="button" data-v15-remove="${t.key}">Quitar</button></div><div class="v15-status" id="v15PhotoStatus_${t.key}" role="status">${p?'Lista para PDF - '+Math.ceil(p.size/1024)+' KB':''}</div></div>`;
  }
  function groupShots(){
    const ts=targets(),groups=[];
    const count=state.other_vehicles_damage==='S\u00ed'?Math.min(20,Number(state.additional_vehicle_count)||0):0;
    const vehicles=[{prefix:'a',label:'A',plate:state.a_plate},{prefix:'b',label:'B',plate:state.b_plate}];
    for(let i=0;i<count;i++)vehicles.push({prefix:'extra_'+i,label:extraLabel(i),plate:state['extra_'+i+'_plate']});
    for(const v of vehicles)groups.push(`<section class="v15-card"><h2>Veh\u00edculo ${v.label} - ${e(v.plate||'Matr\u00edcula pendiente')}</h2><div class="v15-meta">Dos fotograf\u00edas: da\u00f1o y matr\u00edcula.</div>${ts.filter(t=>t.key===v.prefix+'_damage'||t.key===v.prefix+'_plate').map(shot).join('')}</section>`);
    groups.push(`<section class="v15-card"><h2>Otras fotograf\u00edas</h2>${ts.filter(t=>!t.required).map(shot).join('')}</section>`);return groups.join('');
  }
  function downloadPanel(){return `<section class="v15-card"><h2>Fotos listas para enviar</h2><p class="v15-meta">El PDF contiene las im\u00e1genes, no solo sus nombres. Se genera aqu\u00ed, sin subir fotos a un servidor.</p><button type="button" class="v15-btn" id="downloadPhotosPdf">DESCARGAR FOTOS EN PDF</button><div id="v15Status" class="v15-status" role="status"></div><div id="v15Output" class="v15-output"></div><div class="v15-how"><b>Despu\u00e9s, en WhatsApp:</b><br>Abre el chat &rarr; clip o + &rarr; Documento &rarr; selecciona el PDF de Descargas o Archivos &rarr; Enviar.<br>En iPhone, si se abre el visor, usa Compartir &rarr; Guardar en Archivos.</div></section>`;}
  function bindPhotos(){
    document.querySelectorAll('[data-v15-photo]').forEach(inp=>inp.onchange=()=>{
      const f=inp.files&&inp.files[0];if(!f)return;const key=inp.dataset.v15Photo,source=inp.dataset.source;
      pending++;dirty();refreshBusy();
      const n=document.getElementById('v15PhotoStatus_'+key);if(n)n.textContent='Procesando la fotograf\u00eda. Espera a ver la miniatura...';
      const controls=[...document.querySelectorAll(`[data-v15-photo="${key}"]`)];controls.forEach(z=>z.disabled=true);
      queue=queue.then(async()=>{
        try{
          const record=await normalize(f);record.source=source;photos.set(key,record);errors.delete(key);
          state[key+'_name']=record.name;state[key+'_source']=source;state[key+'_data']=record.data;
          const target=document.getElementById('v15Preview_'+key);if(target){const img=document.createElement('img');img.className='v15-preview';img.alt=targets().find(t=>t.key===key)?.label||'Foto';img.src=record.data;target.replaceChildren(img);}
          if(n){n.textContent='Foto lista e incluida en el PDF - '+Math.ceil(record.size/1024)+' KB';n.classList.remove('v15-error');}
          scheduleSave();
        }catch(err){errors.set(key,err.message);if(n){n.textContent=err.message+(photos.has(key)?' Se conserva la foto anterior.':'');n.classList.add('v15-error');}}
        finally{pending--;controls.forEach(z=>{z.disabled=false;z.value='';});refreshBusy();}
      });
    });
    document.querySelectorAll('[data-v15-remove]').forEach(b=>b.onclick=()=>{
      if(pending||busy)return;const k=b.dataset.v15Remove;photos.delete(k);errors.delete(k);delete state[k+'_name'];delete state[k+'_data'];delete state[k+'_source'];dirty();photoScreen();
    });
    bindDownload();
  }
  window.photoScreen=function(){
    host.innerHTML=`<div class="eyebrow">Evidencias - ${VERSION}</div><h1>Fotos del accidente</h1><p class="lead">Haz o selecciona una foto del da\u00f1o y otra de la matr\u00edcula por veh\u00edculo. Comprueba las miniaturas y descarga el PDF para enviarlo por WhatsApp.</p>${groupShots()}${downloadPanel()}<section class="v15-card"><div id="v15LocalNote" class="v15-meta">Borrador local en este navegador, Se descarta al abrirlo si han pasado 24 horas desde el \u00faltimo guardado. No lo dejes en un m\u00f3vil compartido.</div><button class="v15-link" type="button" id="clearV15Photos">Borrar fotos guardadas</button></section>`;
    bindPhotos();document.getElementById('clearV15Photos').onclick=()=>{if(pending||busy)return;if(!confirm('Se borrar\u00e1n las fotos del borrador de este dispositivo. Los PDF ya descargados no se borran.'))return;for(const k of photos.keys()){delete state[k+'_name'];delete state[k+'_data'];delete state[k+'_source'];}photos.clear();errors.clear();dirty();saveDraft();photoScreen();};
  };
  function lines(x,text,max){
    const out=[];let line='';
    for(const char of String(text||'')){if(char==='\n'){out.push(line);line='';continue;}if(x.measureText(line+char).width>max&&line){out.push(line);line='';}line+=char;}
    if(line)out.push(line);return out;
  }
  function textAt(x,text,left,top,max,lineHeight,count){const all=lines(x,text,max),used=all.slice(0,count);used.forEach((line,i)=>x.fillText(line,left,top+i*lineHeight));return used.length;}
  function pageGroups(ts){const out=[];let i=0;while(i<ts.length){out.push(ts.slice(i,i+2));i+=2;}return out;}
  function dataBytes(data){return Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));}
  /* Minimal PDF 1.4 image writer: each /DCTDecode stream contains the actual JPEG bytes.
     Byte offsets, stream lengths and xref are calculated from encoded byte counts. */
  function jpegPagesPdf(pages){
    const encoder=new TextEncoder(),parts=[],offset=[0];let length=0;
    const write=v=>{const b=typeof v==='string'?encoder.encode(v):v;parts.push(b);length+=b.length;};
    const obj=(id,body)=>{offset[id]=length;write(id+' 0 obj\n');write(body);write('\nendobj\n');};
    write('%PDF-1.4\n');write(new Uint8Array([37,226,227,207,211,10]));
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
    pages.forEach((p,i)=>{
      const id=3+i*3;
      obj(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Photo '+(id+2)+' 0 R >> >> /Contents '+(id+1)+' 0 R >>');
      const content='q\n595.28 0 0 841.89 0 0 cm\n/Photo Do\nQ\n';
      obj(id+1,'<< /Length '+encoder.encode(content).length+' >>\nstream\n'+content+'endstream');
      offset[id+2]=length;write((id+2)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.width+' /Height '+p.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n');write(p.bytes);write('\nendstream\nendobj\n');
    });
    const xref=length,n=3+pages.length*3;write('xref\n0 '+n+'\n0000000000 65535 f \n');
    for(let i=1;i<n;i++)write(String(offset[i]).padStart(10,'0')+' 00000 n \n');
    write('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(parts,{type:'application/pdf'});
  }
  async function makePhotoPdf(){
    await queue;const ts=targets().filter(t=>photos.has(t.key));if(!ts.length)throw new Error('A\u00f1ade una fotograf\u00eda y espera a ver su miniatura.');
    const snapshot=new Map(ts.map(t=>[t.key,{...photos.get(t.key)}])),meta={date:state.acc_date||'',time:state.acc_time||'',place:state.acc_place||'',a:state.a_plate||'',b:state.b_plate||''};
    const missing=targets().filter(t=>t.required&&!snapshot.has(t.key));
    const groups=pageGroups(ts),pages=[];
    for(let i=0;i<groups.length;i++){
      status('Incluyendo fotos reales en el PDF: p\u00e1gina '+(i+1)+' de '+groups.length+'...');
      const c=document.createElement('canvas');c.width=1654;c.height=2339;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
      x.fillStyle='#087f73';x.fillRect(0,0,c.width,16);x.textBaseline='top';x.font='bold 40px Arial';x.fillText('ALLZONE LOGISTICS',86,60);
      x.fillStyle='#132d29';x.font='bold 51px Arial';x.fillText('Anexo fotogr\u00e1fico del accidente',86,121);
      x.fillStyle='#344b46';x.font='28px Arial';x.fillText('Fecha: '+meta.date+'  '+meta.time+'   |   A: '+meta.a+'   |   B: '+meta.b,86,199);
      textAt(x,'Lugar: '+meta.place,86,245,1482,33,2);
      x.font='24px Arial';x.fillStyle=missing.length?'#8f4211':'#155e55';
      x.fillText(missing.length?'BORRADOR INCOMPLETO: faltan '+missing.length+' fotos obligatorias.':ts.length+' fotograf\u00edas incorporadas como im\u00e1genes.',86,329);
      for(let j=0;j<groups[i].length;j++){
        const t=groups[i][j],p=snapshot.get(t.key),y=392+j*883;
        x.strokeStyle='#c5d4d0';x.lineWidth=2;x.strokeRect(85,y,1484,829);x.fillStyle='#eaf4f1';x.fillRect(86,y+1,1482,61);
        x.fillStyle='#123c33';x.font='bold 31px Arial';x.fillText(t.label,110,y+15);
        const im=await imageFrom(p.data);const fit=Math.min(1414/im.naturalWidth,681/im.naturalHeight);const w=im.naturalWidth*fit,h=im.naturalHeight*fit;
        x.drawImage(im,120+(1414-w)/2,y+88+(681-h)/2,w,h);
        x.font='22px Arial';x.fillStyle='#50645e';x.fillText('Foto '+(i*2+j+1)+' de '+ts.length+' - '+(p.source==='camera'?'C\u00e1mara':'Biblioteca'),111,y+788);
      }
      x.strokeStyle='#c5d4d0';x.beginPath();x.moveTo(86,2197);x.lineTo(1568,2197);x.stroke();
      x.font='23px Arial';x.fillStyle='#47625a';x.fillText('flota@allzonelogistics.com - '+VERSION,86,2222);x.textAlign='right';x.fillText('P\u00e1gina '+(i+1)+' / '+groups.length,1568,2222);x.textAlign='left';
      x.font='22px Arial';x.fillText('Anexo de evidencias. No sustituye a la Declaraci\u00f3n Amistosa de Accidente.',86,2270);
      pages.push({width:c.width,height:c.height,bytes:dataBytes(c.toDataURL('image/jpeg',.87))});c.width=1;c.height=1;
      await new Promise(r=>setTimeout(r,0));
    }
    const blob=jpegPagesPdf(pages);if(blob.size>48*1024*1024)throw new Error('El PDF supera 48 MB. Descarga menos fotos por expediente para facilitar el env\u00edo.');
    return {blob,count:ts.length,pages:pages.length,missing:missing.length};
  }
  function outputLinks(){
    const box=document.getElementById('v15Output');if(!box||!lastUrl)return;
    box.innerHTML=`<a class="v15-link" href="${lastUrl}" download="${e(lastName)}">GUARDAR PDF EN EL M\u00d3VIL</a><a class="v15-link" href="${lastUrl}" target="_blank" rel="noopener">VER PDF Y COMPROBAR LAS FOTOS</a>`;
  }
  function bindDownload(){
    const b=document.getElementById('downloadPhotosPdf');if(!b)return;outputLinks();refreshBusy();
    b.onclick=async()=>{
      if(busy||pending||restoring)return;busy=true;refreshBusy();
      try{
        const {blob,count,pages,missing}=await makePhotoPdf();if(lastUrl)URL.revokeObjectURL(lastUrl);lastUrl=URL.createObjectURL(blob);
        const clean=s=>String(s||'SIN_MATRICULA').replace(/[^A-Za-z0-9_-]/g,'_');
        lastName='FOTOS_ALLZONE_'+clean(state.acc_date)+'_'+clean(state.a_plate)+'_'+clean(state.b_plate)+'.pdf';
        outputLinks();status('PDF preparado: '+count+' fotos en '+pages+' p\u00e1gina(s), '+(blob.size/1024/1024).toFixed(2)+' MB.'+(missing?' Faltan '+missing+' fotos obligatorias.':''));
        const a=document.createElement('a');a.href=lastUrl;a.download=lastName;document.body.appendChild(a);a.click();a.remove();
      }catch(err){status(err.message||'No se pudo generar el PDF. Las fotos siguen en el borrador.',true);}
      finally{busy=false;refreshBusy();}
    };
  }
  /* Keep the ordinary DAA preview. Its photo annex now contains real images too. */
  window.populateEvidenceAnnex=function(){
    const annex=document.querySelector('#daaPrint .annex');if(!annex)return;
    annex.innerHTML='<h2>ANEXO FOTOGR\u00c1FICO - ALLZONE</h2><p>'+e(state.acc_date)+' - '+e(state.acc_place)+'</p>'+selected().map(t=>'<div class="v15-photo-print"><b>'+e(t.label)+'</b><img src="'+photos.get(t.key).data+'" alt="'+e(t.label)+'"></div>').join('');
  };
  window.openDaaDocument=function(){
    if(pending||busy){alert('Espera a que termine la preparaci\u00f3n de las fotos.');return;}
    sync();prepPrint();const win=window.open('','_blank');if(!win){alert('Permite abrir la vista del parte en otra pesta\u00f1a. Las fotos se pueden descargar con DESCARGAR FOTOS EN PDF.');return;}
    const style=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
    win.document.open();win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Parte Allzone</title><style>'+style+'</style></head><body><div id="daaPrint" style="display:block">'+document.getElementById('daaPrint').innerHTML+'</div></body></html>');win.document.close();
    Promise.all([...win.document.images].map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;}))).then(()=>{win.focus();win.print();});
  };
  const originalReview=window.reviewScreen;
  window.reviewScreen=function(){
    originalReview();const old=document.getElementById('sendDaaWhatsapp');if(old)old.remove();
    const preview=document.getElementById('previewPdf');if(preview){preview.textContent='VER PARTE / GUARDAR PDF';preview.onclick=()=>openDaaDocument();}
    const hint=host.querySelector('.double-actions .hint');if(hint)hint.textContent='El parte se abre para imprimir o guardar. Descarga las fotograf\u00edas con el bot\u00f3n independiente de abajo.';
    host.insertAdjacentHTML('beforeend',downloadPanel());bindDownload();
  };
  const originalValidate=window.validateStep;
  window.validateStep=function(){
    if(restoring||pending||busy)return false;
    if(getSteps()[idx]?.title==='Fotos'){
      const missing=targets().filter(t=>t.required&&!photos.has(t.key));
      if(missing.length){alert('Faltan fotograf\u00edas reales: '+missing.map(t=>t.label).join(', ')+'. Espera a ver sus miniaturas.');return false;}return true;
    }
    return originalValidate();
  };
  const originalRender=window.render;
  window.render=function(){originalRender();if(idx===getSteps().length-1)nextBtn.textContent='VER PARTE';refreshBusy();scheduleSave();};
  nextBtn.onclick=()=>{if(!validateStep())return;if(idx<getSteps().length-1){idx++;render();}else openDaaDocument();};
  document.addEventListener('input',ev=>{if(ev.target.matches('[data-field]'))dirty();});
  window.addEventListener('pagehide',saveDraft);
  async function initStore(){
    try{
      db=await new Promise((resolve,reject)=>{const q=indexedDB.open('allzone-photo-draft-v15',1);q.onupgradeneeded=()=>q.result.createObjectStore('draft');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(new Error('blocked'));});
      const saved=await new Promise((resolve,reject)=>{const q=db.transaction('draft').objectStore('draft').get('current');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
      if(saved&&Date.now()-saved.at<TTL){
        Object.assign(state,saved.state,{fleet_email:'flota@allzonelogistics.com'});
        for(const [k,p] of saved.photos||[])if(p&&typeof p.data==='string'&&p.data.startsWith('data:image/jpeg;base64,')){photos.set(k,p);state[k+'_data']=p.data;}
        idx=Math.min(Number(saved.step)||0,getSteps().length-1);
      }else if(saved){db.transaction('draft','readwrite').objectStore('draft').delete('current');}
    }catch(_){db=null;}
    finally{restoring=false;render();}
  }
  window.AllzonePhotoPdf={version:VERSION,build:makePhotoPdf,pdfWriter:jpegPagesPdf,ready:()=>!restoring&&pending===0,get count(){return selected().length;}};
  initStore();
})();
