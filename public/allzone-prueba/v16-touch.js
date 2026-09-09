/* Allzone V16.4.1 - mobile viewport/touch hardening */
(function(){
'use strict';
if(window.AllzoneTouchFix)return;
const VERSION='V16.4.1 · BOTON CONTINUAR FIJO';
const css=document.createElement('style');
css.id='allzone-touch-fix-1641';
css.textContent=`
:root{--az-touch-bottom:0px}
html,body{overscroll-behavior-y:none!important}
.footerbar{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:var(--az-touch-bottom)!important;
  z-index:2147483000!important;
  pointer-events:auto!important;
  touch-action:manipulation!important;
  transform:translate3d(-50%,0,0)!important;
  -webkit-transform:translate3d(-50%,0,0)!important;
  padding-bottom:calc(12px + env(safe-area-inset-bottom))!important;
  isolation:isolate!important;
}
.footerbar button,.footerbar .next,.footerbar .back{
  position:relative!important;
  z-index:2!important;
  pointer-events:auto!important;
  touch-action:manipulation!important;
  -webkit-user-select:none!important;
  user-select:none!important;
  -webkit-tap-highlight-color:rgba(8,127,115,.12)!important;
}
.footerbar .next[disabled]{opacity:1!important;filter:none!important}
.screen{padding-bottom:104px!important}
@media(max-height:650px){.footerbar{padding-top:6px!important;padding-bottom:calc(9px + env(safe-area-inset-bottom))!important}.screen{padding-bottom:96px!important}}
`;
document.head.appendChild(css);

function keepContinueLive(){
  if(!window.nextBtn)return;
  try{nextBtn.disabled=false;nextBtn.removeAttribute('disabled');}catch(_){ }
  nextBtn.style.pointerEvents='auto';
  nextBtn.style.touchAction='manipulation';
  nextBtn.setAttribute('aria-disabled','false');
}

function syncInnerViewport(){
  const vv=window.visualViewport;
  const visibleH=Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||0);
  document.documentElement.style.setProperty('--az-visible-height',visibleH+'px');
  document.documentElement.style.setProperty('--az-touch-bottom','0px');
  keepContinueLive();
}

window.addEventListener('message',e=>{
  const d=e.data;
  if(!d||d.type!=='allzone-viewport')return;
  if(Number.isFinite(d.height))document.documentElement.style.setProperty('--az-visible-height',Math.round(d.height)+'px');
  keepContinueLive();
});
window.addEventListener('resize',syncInnerViewport,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(syncInnerViewport,80),{passive:true});
window.addEventListener('focus',keepContinueLive,{passive:true});
window.addEventListener('pageshow',keepContinueLive,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepContinueLive();},{passive:true});
if(window.visualViewport){
  visualViewport.addEventListener('resize',syncInnerViewport,{passive:true});
  visualViewport.addEventListener('scroll',syncInnerViewport,{passive:true});
}

if(window.nextBtn){
  const mo=new MutationObserver(()=>keepContinueLive());
  mo.observe(nextBtn,{attributes:true,attributeFilter:['disabled','style','class']});
}

const priorRender=window.render;
window.render=function(){
  priorRender();
  keepContinueLive();
  requestAnimationFrame(keepContinueLive);
  const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;
  document.title='Allzone '+VERSION;
};

syncInnerViewport();
keepContinueLive();
window.AllzoneTouchFix={version:VERSION,syncInnerViewport,keepContinueLive};
window.render();
})();