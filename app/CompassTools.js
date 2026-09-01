'use client';
import {useEffect,useRef,useState} from 'react';
import './compass-tools.css';
import './compass-professional.css';
import './compass-course-entry.css';
import './compass-warning.css';
import {adaptiveHeading,angleDifference,calibrationWarning,circularMean,circularSpread,headingFromQuaternion,nextCalibrationState,normalizeHeading,shouldUseHeadingSource} from './compassMath';

const DIRECTIONS=['N','NE','E','SE','S','SO','O','NO'];
const COURSE=[
 {title:'Conoce las partes',icon:'⌖',text:'La flecha roja señala el norte. El número indica grados: norte 0°, este 90°, sur 180° y oeste 270°.',task:'Busca la N y recuerda que siempre representa el norte.'},
 {title:'Sujeta bien el móvil',icon:'▭',text:'Mantén el teléfono plano, alejado de llaves, hebillas, altavoces y objetos metálicos que alteran el sensor.',task:'Coloca el móvil horizontal a la altura de la cintura.'},
 {title:'Orienta un rumbo',icon:'↑',text:'Gira despacio hasta que el rumbo deseado quede arriba. Si buscas el este, detente aproximadamente en 90°.',task:'Practica encontrando primero el norte y después el este.'},
 {title:'Relaciona mapa y terreno',icon:'△',text:'Gira el mapa hasta que su norte coincida con el norte de la brújula. Identifica dos referencias visibles antes de avanzar.',task:'Busca una montaña, camino o edificio que también aparezca en el mapa.'},
 {title:'Úsala con seguridad',icon:'!',text:'Una brújula orienta, pero no confirma que el terreno sea transitable. No sigas un rumbo que cruce cortados, ríos, carreteras o fincas cerradas.',task:'Si estás perdido, detente y utiliza “Estoy perdido” o llama al 112.'}
];

export default function CompassTools(){
 const[open,setOpen]=useState(false),[course,setCourse]=useState(false),[courseStep,setCourseStep]=useState(0),[heading,setHeading]=useState(null),[error,setError]=useState(''),[warning,setWarning]=useState(''),[needsPermission,setNeedsPermission]=useState(false),[calibration,setCalibration]=useState('waiting'),[sensorSource,setSensorSource]=useState(''),headingRef=useRef(null),listeningRef=useRef(false),samplesRef=useRef([]),lastRawRef=useRef(null),lastPaintRef=useRef(0),absoluteSeenRef=useRef(false),genericSensorRef=useRef(null),sourceRef=useRef(''),warningDismissedRef=useRef(false),calibrationRef=useRef('waiting');
 useEffect(()=>{if(sessionStorage.getItem('encumbrate:compass-open')==='1')setOpen(true);const show=()=>{sessionStorage.setItem('encumbrate:compass-open','1');setOpen(true)},learn=()=>{setCourseStep(0);setCourse(true)};window.addEventListener('encumbrate:open-compass',show);window.addEventListener('encumbrate:open-compass-course',learn);return()=>{window.removeEventListener('encumbrate:open-compass',show);window.removeEventListener('encumbrate:open-compass-course',learn)}},[]);
 useEffect(()=>{if(!open)return;resetSensor();warningDismissedRef.current=false;setWarning('');setHeading(null);setSensorSource('');setCalibration('waiting');setError('');const orientationAvailable=typeof DeviceOrientationEvent!=='undefined',genericAvailable=typeof window.AbsoluteOrientationSensor==='function';if(!orientationAvailable&&!genericAvailable){setError('Este navegador no permite acceder al sensor de orientación.');return}const requiresTap=orientationAvailable&&typeof DeviceOrientationEvent.requestPermission==='function';setNeedsPermission(requiresTap);if(!requiresTap)attachSensor();const fallback=setTimeout(()=>{if(headingRef.current===null)startGenericSensor()},1800),timer=setTimeout(()=>{if(headingRef.current===null){setCalibration('calibrating');setError('No recibimos datos del sensor. Pulsa “Activar brújula” y comprueba que Chrome tenga permitidos los sensores de movimiento.')}},4500);return()=>{clearTimeout(fallback);clearTimeout(timer);detachSensor()}},[open]);
 function screenAngle(){return Number(screen.orientation?.angle)||Number(window.orientation)||0}
 function resetSensor(){headingRef.current=null;samplesRef.current=[];lastRawRef.current=null;lastPaintRef.current=0;absoluteSeenRef.current=false;sourceRef.current='';calibrationRef.current='waiting'}
 function readOrientation(event){
  const ios=Number.isFinite(event.webkitCompassHeading),absolute=ios||event.type==='deviceorientationabsolute'||event.absolute===true;
  if(event.type==='deviceorientationabsolute')absoluteSeenRef.current=true;
  if(!absolute||(!ios&&event.type==='deviceorientation'&&absoluteSeenRef.current))return;
  const beta=Number(event.beta),gamma=Number(event.gamma);
  if((Number.isFinite(beta)&&Math.abs(beta)>55)||(Number.isFinite(gamma)&&Math.abs(gamma)>55)){setCalibration('calibrating');setError('Coloca el móvil más plano para obtener un norte fiable.');return}
  const raw=ios?event.webkitCompassHeading:Number.isFinite(event.alpha)?360-event.alpha+screenAngle():null;
  if(raw===null)return;
  consumeHeading(raw,{source:ios?'Brújula iPhone':'Sensor Android',ios,accuracy:Number(event.webkitCompassAccuracy)});
 }
 function consumeHeading(raw,{source,ios=false,accuracy=NaN}){
  if(!shouldUseHeadingSource(sourceRef.current,source))return;
  if(sourceRef.current!==source){sourceRef.current=source;samplesRef.current=[];lastRawRef.current=null;lastPaintRef.current=0;setSensorSource(source);setNeedsPermission(false)}
  const value=normalizeHeading(raw),now=performance.now(),lastRaw=lastRawRef.current;
  if(lastRaw&&now-lastRaw.at<70&&Math.abs(angleDifference(value,lastRaw.value))>135)return;
  lastRawRef.current={value,at:now};
  const samples=samplesRef.current;samples.push(value);if(samples.length>24)samples.shift();
  if(samples.length<8){setCalibration('calibrating');return}
  const recent=samples.slice(-10),displaySamples=samples.slice(-5),mean=circularMean(displaySamples),spread=circularSpread(recent,circularMean(recent)),accurateIos=!ios||!Number.isFinite(accuracy)||accuracy<0||accuracy<=35,nextCalibration=nextCalibrationState(calibrationRef.current,spread,accurateIos);
  calibrationRef.current=nextCalibration;setCalibration(nextCalibration);
  if(now-lastPaintRef.current<100)return;
  lastPaintRef.current=now;
  const next=adaptiveHeading(headingRef.current,mean);
  headingRef.current=next;setHeading(next);
  const notice=calibrationWarning(warningDismissedRef.current,{ios,accuracy,spread});
  if(notice)setWarning(notice)
 }
 function startGenericSensor(){if(genericSensorRef.current||typeof window.AbsoluteOrientationSensor!=='function')return;try{const sensor=new window.AbsoluteOrientationSensor({frequency:20,referenceFrame:'device'});genericSensorRef.current=sensor;sensor.addEventListener('reading',()=>{const value=headingFromQuaternion(sensor.quaternion);if(value===null){setCalibration('calibrating');return}consumeHeading(value+screenAngle(),{source:'Sensor Android avanzado'})});sensor.addEventListener('error',()=>{genericSensorRef.current=null;if(headingRef.current===null)setError('Chrome está bloqueando los sensores de movimiento. Actívalos en los permisos del sitio y vuelve a intentarlo.')});sensor.start()}catch{genericSensorRef.current=null}}
 function attachSensor(){if(listeningRef.current)return;listeningRef.current=true;window.addEventListener('deviceorientationabsolute',readOrientation,true);window.addEventListener('deviceorientation',readOrientation,true)}
 function detachSensor(){listeningRef.current=false;window.removeEventListener('deviceorientationabsolute',readOrientation,true);window.removeEventListener('deviceorientation',readOrientation,true);try{genericSensorRef.current?.stop()}catch{}genericSensorRef.current=null;resetSensor()}
 async function activate(){try{setError('');setCalibration('waiting');if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted')return setError('Activa el permiso de movimiento y orientación en el navegador.')}setNeedsPermission(false);attachSensor();startGenericSensor();setTimeout(()=>{if(headingRef.current===null)setError('Sin lectura. En Chrome abre Configuración > Configuración de sitios > Sensores de movimiento y permite el acceso.')},2500)}catch{setError('No se ha podido activar el sensor de orientación.')}}
 function closeCompass(){sessionStorage.removeItem('encumbrate:compass-open');setOpen(false)}
 function dismissWarning(){warningDismissedRef.current=true;setWarning('')}
 const degrees=heading===null?0:Math.round(heading),direction=DIRECTIONS[Math.round(degrees/45)%8];
 return <>{open&&<aside className="compassWidget" aria-label="Brújula"><header><div><small>ENCÚMBRATE · ORIENTACIÓN</small><strong>{heading===null?'BRÚJULA':`${String(degrees).padStart(3,'0')}° · ${direction}`}</strong></div><button onClick={closeCompass} aria-label="Cerrar brújula">×</button></header><div className="compassDial"><div className="compassTicks"/><div className="compassRose" style={{transform:`rotate(${-heading||0}deg)`}}><b className="north">N</b><b className="east">E</b><b className="south">S</b><b className="west">O</b><i/></div><span className="compassIndex">▲</span><span className="compassHub"/></div><div className={`compassStatus ${calibration}`}><i/><span>{heading!==null?(calibration==='stable'?'Norte estabilizado':'Calibrando…'):needsPermission?'Sensor detenido':'Buscando norte…'}{sensorSource?` · ${sensorSource}`:''}</span></div>{heading===null&&<button className="compassActivate" onClick={activate}>Activar brújula</button>}{error&&<p className="compassError">{error}</p>}{warning&&<div className="compassWarning" role="status"><strong>⚠ Calibración necesaria</strong><span>{warning}</span><button onClick={dismissWarning}>Entendido</button></div>}<button className="compassLearn" onClick={()=>{setCourseStep(0);setCourse(true)}} aria-label="Aprender a usar la brújula">?</button></aside>}{course&&<CompassCourse step={courseStep} setStep={setCourseStep} close={()=>setCourse(false)}/>}</>
}

function CompassCourse({step,setStep,close}){const item=COURSE[step],last=step===COURSE.length-1;return <section className="compassCourse" role="dialog" aria-modal="true"><header><button onClick={close}>×</button><small>CURSO DE SEGURIDAD</small><h1>Aprende a usar la brújula</h1><div>{COURSE.map((_,index)=><i key={index} className={index<=step?'active':''}/>)}</div></header><main><span className="courseCompassIcon">{item.icon}</span><small>PASO {step+1} DE {COURSE.length}</small><h2>{item.title}</h2><p>{item.text}</p><div className="courseTask"><b>Practica ahora</b><span>{item.task}</span></div><div className="courseButtons">{step>0&&<button onClick={()=>setStep(step-1)}>Atrás</button>}<button className="courseNext" onClick={()=>last?close():setStep(step+1)}>{last?'Terminar curso':'Lo entiendo · Siguiente'}</button></div></main></section>}
