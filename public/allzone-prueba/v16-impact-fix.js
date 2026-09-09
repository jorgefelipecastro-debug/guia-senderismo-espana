/* Allzone V16.4.8 - normalized vehicle impact coordinates */
(function(){
'use strict';
if(window.AllzoneImpactFix)return;

const VERSION='V16.4.8 · IMPACTOS NORMALIZADOS';
const EDIT_W=430;
const EDIT_H=330;

const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));

function sourceSize(key,pts){
  if(key==='impactsA'||key==='impactsB')return [EDIT_W,EDIT_H];
  const maxX=Math.max(0,...(pts||[]).map(p=>Number(p?.[0])||0));
  const maxY=Math.max(0,...(pts||[]).map(p=>Number(p?.[1])||0));
  return maxX>320||maxY>230?[EDIT_W,EDIT_H]:[320,230];
}

function normKey(key){return key+'Norm';}

function normalized(key){
  const pts=typeof getImpactList==='function'?getImpactList(key):(Array.isArray(state[key])?state[key]:[]);
  const nk=normKey(key);
  if(Array.isArray(state[nk])&&state[nk].length===pts.length){
    return state[nk].map(p=>[clamp(p?.[0]),clamp(p?.[1])]);
  }
  const [sw,sh]=sourceSize(key,pts);
  const n=pts.map(p=>[clamp((Number(p?.[0])||0)/sw),clamp((Number(p?.[1])||0)/sh)]);
  state[nk]=n;
  return n;
}

function persistNormalized(key,n){
  const clean=(n||[]).map(p=>[clamp(p?.[0]),clamp(p?.[1])]);
  state[normKey(key)]=clean;
  state[key]=clean.map(p=>[p[0]*EDIT_W,p[1]*EDIT_H]);
  return clean;
}

function pixels(key,w,h){
  return normalized(key).map(p=>[p[0]*w,p[1]*h]);
}

function drawImpactCanvas(ctx,key,type,label,w,h){
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  technicalVehicle(ctx,type,w,h,label);
  renderImpactMarkers(ctx,pixels(key,w,h));
}

window.impactScreen=function(side){
  const key='impacts'+side;
  const type=state[side.toLowerCase()+'_vehicle_type']||'Coche';
  let appendMode=false;
  normalized(key);
  host.innerHTML=`<div class="eyebrow">Vehículo ${side}</div><h1>Indica el punto de impacto</h1><p class="lead">Toca la zona del primer contacto. Si hay varios impactos, pulsa <b>Agregar punto</b> y marca cada uno.</p><div class="card"><div class="impact-wrap"><canvas class="impact" id="impactCanvas" width="${EDIT_W}" height="${EDIT_H}"></canvas></div><div class="impact-counter"><span id="impactCounter"></span><span id="impactModeMsg">El siguiente toque actualizará el último punto.</span></div><div class="impact-actions"><button type="button" class="pillbtn" id="addImpact">Agregar punto</button><button type="button" class="pillbtn" id="undoImpact">Eliminar último</button><button type="button" class="pillbtn fullbtn" id="clearImpact">Borrar todos los puntos</button></div><div class="impact-help">El punto 1 es el impacto inicial. La posición se conserva proporcionalmente para que salga exactamente en el mismo lugar del parte final.</div></div>`;
  const c=document.getElementById('impactCanvas'),ctx=c.getContext('2d');
  function draw(){
    drawImpactCanvas(ctx,key,type,side,c.width,c.height);
    const n=normalized(key).length;
    const counter=document.getElementById('impactCounter');if(counter)counter.textContent=`Puntos marcados: ${n}`;
    const msg=document.getElementById('impactModeMsg');if(msg)msg.textContent=appendMode?'El próximo toque añadirá un nuevo punto.':'El siguiente toque actualizará el último punto.';
    document.getElementById('addImpact')?.classList.toggle('active',appendMode);
  }
  c.addEventListener('pointerdown',e=>{
    const r=c.getBoundingClientRect();
    const p=[clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height)];
    const arr=normalized(key).map(q=>[q[0],q[1]]);
    if(!arr.length||appendMode){arr.push(p);appendMode=false}else arr[arr.length-1]=p;
    persistNormalized(key,arr);draw();
  });
  document.getElementById('addImpact').onclick=()=>{appendMode=true;draw();};
  document.getElementById('undoImpact').onclick=()=>{const arr=normalized(key).slice(0,-1);persistNormalized(key,arr);appendMode=false;draw();};
  document.getElementById('clearImpact').onclick=()=>{persistNormalized(key,[]);appendMode=false;draw();};
  draw();
};

function imageFor(key,type,label){
  const c=document.createElement('canvas');c.width=EDIT_W;c.height=EDIT_H;
  const ctx=c.getContext('2d');drawImpactCanvas(ctx,key,type,label,c.width,c.height);
  return c.toDataURL('image/png');
}

window.blankImpact=function(side){
  return imageFor('impacts'+side,state[side.toLowerCase()+'_vehicle_type']||'Coche',side);
};

window.extraImpactImage=function(i){
  const p=`extra_${i}_`,label=typeof extraLabel==='function'?extraLabel(i):String.fromCharCode(67+i);
  return imageFor(p+'impacts',state[p+'vehicle_type']||'Coche',label);
};

const previousPrep=window.prepPrint;
window.prepPrint=function(){
  if(typeof previousPrep==='function')previousPrep();
  const a=document.getElementById('impactPrintA');
  const b=document.getElementById('impactPrintB');
  if(a)a.src=window.blankImpact('A');
  if(b)b.src=window.blankImpact('B');
};

const banner=document.querySelector('.v16-banner');if(banner)banner.textContent=VERSION;
window.AllzoneImpactFix={version:VERSION,normalized,pixels};
})();
