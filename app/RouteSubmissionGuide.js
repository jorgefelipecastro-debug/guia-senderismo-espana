'use client';
import {useEffect,useState} from 'react';
import './route-submission-guide.css';

const STEPS=[
 {icon:'⌖',title:'Graba el recorrido completo',tool:'Móvil o reloj con GPS',text:'Empieza a grabar en el punto de inicio, realiza el sendero completo y detén la grabación al terminar. Activa la ubicación precisa y lleva batería suficiente.'},
 {icon:'GPX',title:'Exporta el archivo GPX',tool:'Aplicación de tu reloj o grabador GPS',text:'Busca “Exportar”, “Compartir recorrido” o “Descargar GPX”. El archivo debe terminar en .gpx; una fotografía del mapa o un PDF no sirven.'},
 {icon:'▤',title:'Guárdalo en el teléfono',tool:'Archivos en iPhone o Files/Descargas en Android',text:'Guarda el GPX en una carpeta que puedas localizar. Si te lo envías por correo o WhatsApp, descárgalo primero en el dispositivo.'},
 {icon:'✓',title:'Prepara información real',tool:'Tus notas y observaciones del sendero',text:'Necesitarás municipio, dificultad, señalización y riesgos. Indica cruces, cortados, ríos, carreteras y zonas sin cobertura.'},
 {icon:'↑',title:'Sube y revisa',tool:'Selector de archivos de Encúmbrate',text:'Comprobaremos puntos GPS, distancia, desnivel, altitud, saltos y duplicados. Después completarás la ficha antes de enviarla a supervisión.'}
];

export default function RouteSubmissionGuide(){
 const[open,setOpen]=useState(false),[step,setStep]=useState(0);
 useEffect(()=>{const show=()=>{setStep(0);setOpen(true)};window.addEventListener('encumbrate:propose-route',show);return()=>window.removeEventListener('encumbrate:propose-route',show)},[]);
 if(!open)return null;
 const item=STEPS[step],last=step===STEPS.length-1;
 function finish(){setOpen(false);setTimeout(()=>document.querySelector('.gpxDrop input[type="file"]')?.click(),120)}
 return <section className="uploadGuide" role="dialog" aria-modal="true" aria-label="Guía para proponer una ruta"><div className="guideTop"><small>GUÍA PASO A PASO</small><button onClick={()=>setOpen(false)} aria-label="Cerrar guía">×</button></div><div className="guideProgress" aria-label={`Paso ${step+1} de ${STEPS.length}`}>{STEPS.map((_,index)=><i key={index} className={index<=step?'done':''}/>)}</div><div className="guideNumber">PASO {step+1} DE {STEPS.length}</div><div className="guideIcon">{item.icon}</div><h2>{item.title}</h2><strong>Herramienta: {item.tool}</strong><p>{item.text}</p>{step===1&&<div className="gpxExample"><span>✓ ruta-sierra.gpx</span><span>✕ foto-mapa.jpg</span><span>✕ indicaciones.pdf</span></div>}<div className="guideActions">{step>0?<button onClick={()=>setStep(step-1)}>Atrás</button>:<button onClick={finish}>Ya tengo un GPX</button>}<button className="guideNext" onClick={()=>last?finish():setStep(step+1)}>{last?'Elegir mi archivo GPX':'Siguiente'}</button></div></section>
}

