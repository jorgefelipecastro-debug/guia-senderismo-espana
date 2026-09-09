/* Allzone V16.4.3 - compact keyboard writing mode */
(function(){
'use strict';
if(window.AllzoneKeyboardMode)return;
const VERSION='V16.4.3 · MODO ESCRITURA COMPACTO';
let baseline=0, keyboardOpen=false, raf=0;

const css=document.createElement('style');
css.id='allzone-keyboard-mode-1643';
css.textContent=`
body.az-keyboard-open .v16-banner{display:none!important}
body.az-keyboard-open .brandbar{height:42px!important;min-height:42px!important;padding:3px 8px!important}
body.az-keyboard-open .brandbar img{height:26px!important;max-width:112px!important}
body.az-keyboard-open .brandbar .stepno{width:28px!important;height:28px!important;flex-basis:28px!important;font-size:11px!important}
body.az-keyboard-open .pro-step-title{font-size:9px!important;max-width:125px!important}
body.az-keyboard-open .progress{height:2px!important}
body.az-keyboard-open .screen{padding:6px 8px 62px!important;background:#f8fbfa!important}
body.az-keyboard-open .eyebrow{font-size:8.5px!important;margin-bottom:1px!important}
body.az-keyboard-open .screen h1{font-size:16px!important;line-height:1.05!important;margin:0 0 2px!important}
body.az-keyboard-open .screen p.lead{font-size:10px!important;line-height:1.2!important;margin:0 0 5px!important;max-height:26px!important;overflow:hidden!important}
body.az-keyboard-open .card,body.az-keyboard-open .v162-photo-card,body.az-keyboard-open .v163-card{padding:7px!important;margin:4px 0!important;border-radius:10px!important;box-shadow:none!important}
body.az-keyboard-open .grid{gap:4px!important}
body.az-keyboard-open .field{margin-bottom:4px!important}
body.az-keyboard-open .field label{font-size:9px!important;margin-bottom:2px!important}
body.az-keyboard-open .field input,body.az-keyboard-open .field select,body.az-keyboard-open .field textarea,body.az-keyboard-open .phone select,body.az-keyboard-open .phone input{min-height:35px!important;height:35px!important;padding:5px 7px!important;font-size:13px!important;border-radius:8px!important}
body.az-keyboard-open .field textarea{min-height:44px!important;height:44px!important;resize:none!important}
body.az-keyboard-open .yesno button,body.az-keyboard-open .pillbtn{min-height:34px!important;padding:5px 7px!important;font-size:11px!important}
body.az-keyboard-open .fixed{padding:6px 8px!important;font-size:10.5px!important}
body.az-keyboard-open .footerbar{padding:4px 7px calc(4px + env(safe-area-inset-bottom))!important;gap:5px!important;min-height:50px!important;background:#fff!important}
body.az-keyboard-open .footerbar button{min-height:40px!important;height:40px!important;padding:6px 9px!important;border-radius:9px!important;font-size:12px!important}
body.az-keyboard-open .footerbar .back{flex:.65!important}
body.az-keyboard-open .footerbar .next{flex:2.35!important}
body.az-keyboard-open .safe,body.az-keyboard-open .hint,body.az-keyboard-open .mini-note{font-size:9.5px!important;margin:2px 0!important}
body.az-keyboard-open .choice{min-height:84px!important}
body.az-keyboard-open .choice .v16-choice{height:52px!important}
body.az-keyboard-open .choice span{font-size:10.5px!important}
body.az-keyboard-open .reviewrow{padding:4px 0!important;font-size:10px!important}
body.az-keyboard-open .location-row{grid-template-columns:1fr 34px!important}
body.az-keyboard-open .gps-btn{width:34px!important;height:34px!important}
body.az-keyboard-open .phone{grid-template-columns:70px 1fr!important;gap:4px!important}
body.az-keyboard-open input:focus,body.az-keyboard-open textarea:focus,body.az-keyboard-open select:focus{scroll-margin-top:58px!important;scroll-margin-bottom:64px!important}
`;
document.head.appendChild(css);

function activeFormField(){const a=document.activeElement;return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);}
function visibleHeight(){return Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||0);}
function detect(){
  const h=visibleHeight();if(!baseline||(!keyboardOpen&&h>baseline))baseline=h;
  const focused=activeFormField();
  const threshold=Math.max(180,baseline*0.22);
  const open=focused&&(baseline-h>threshold||h<baseline*0.78);
  if(open!==keyboardOpen){keyboardOpen=open;document.body.classList.toggle('az-keyboard-open',open);window.AllzoneTouchFix?.keepContinueLive?.();}
  if(open&&focused){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{try{document.activeElement.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});}catch(_){}});}
}

function onFocus(e){if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)){setTimeout(detect,60);setTimeout(detect,220);}}
function onBlur(){setTimeout(detect,120);setTimeout(detect,320);}
document.addEventListener('focusin',onFocus,true);document.addEventListener('focusout',onBlur,true);
window.addEventListener('resize',detect,{passive:true});window.addEventListener('orientationchange',()=>{baseline=0;setTimeout(detect,250)},{passive:true});
if(window.visualViewport){visualViewport.addEventListener('resize',detect,{passive:true});visualViewport.addEventListener('scroll',detect,{passive:true});}
window.addEventListener('message',e=>{if(e.data?.type==='allzone-viewport')setTimeout(detect,0);});

const priorRender=window.render;
window.render=function(){priorRender();document.body.classList.toggle('az-keyboard-open',keyboardOpen);const b=document.querySelector('.v16-banner');if(b)b.textContent=VERSION;window.AllzoneTouchFix?.keepContinueLive?.();};

baseline=visibleHeight();detect();
window.AllzoneKeyboardMode={version:VERSION,detect,get keyboardOpen(){return keyboardOpen;}};
window.render();
})();