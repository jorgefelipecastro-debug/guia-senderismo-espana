'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import './hiker-assessment.css';

const questions = [
  { id:'frequency', title:'¿Con qué frecuencia haces senderismo?', options:[['Casi nunca',0],['Algunas veces al año',1],['1–3 veces al mes',2],['Todas las semanas',3]] },
  { id:'distance', title:'¿Qué distancia puedes completar cómodamente?', options:[['Menos de 8 km',0],['8–15 km',1],['15–25 km',2],['Más de 25 km',3]] },
  { id:'elevation', title:'¿Qué desnivel positivo afrontas habitualmente?', options:[['Menos de 300 m',0],['300–600 m',1],['600–1.000 m',2],['Más de 1.000 m',3]] },
  { id:'autonomy', title:'¿Has realizado rutas largas sin guía?', options:[['Nunca',0],['Alguna ruta sencilla',1],['Sí, con cierta frecuencia',2],['Sí, habitualmente y con autonomía',3]] },
  { id:'orientation', title:'Te pierdes y no tienes cobertura. ¿Sabrías determinar tu posición?', safety:true, options:[['No',0],['Con GPS o mapa offline',1],['Con mapa y referencias del terreno',2],['También con mapa y brújula',3]] },
  { id:'compass', title:'¿Sabes utilizar una brújula para orientarte?', safety:true, options:[['No',0],['Conozco lo básico',1],['Sí, puedo seguir un rumbo',2],['Sí, junto con mapa topográfico',3]] },
  { id:'coordinates', title:'¿Sabes obtener y comunicar tus coordenadas en una emergencia?', safety:true, options:[['No',0],['Creo que sabría hacerlo',1],['Sí, sin problema',3]] },
  { id:'firstAid', title:'Ante una lesión durante una ruta, ¿qué autonomía tienes?', safety:true, options:[['Necesitaría ayuda',0],['Conocimientos básicos',1],['Sé actuar ante lesiones habituales',2],['Tengo formación específica',3]] },
  { id:'weather', title:'Si empeora mucho el tiempo durante la ruta, ¿qué harías?', safety:true, options:[['Seguiría salvo que fuera imposible',0],['Decidiría sobre la marcha',1],['Evaluaría posición, retorno y refugios antes de continuar',3]] },
  { id:'preparation', title:'Antes de una ruta desconocida, ¿qué compruebas?', safety:true, options:[['Poco o nada',0],['Distancia y duración',1],['Ruta, desnivel y meteorología',2],['Además mapas offline, agua, material, escape y aviso a terceros',3]] }
];

function localResult(answers){
  const vals=questions.map(q=>Number(answers[q.id] ?? 0));
  const score=vals.reduce((a,b)=>a+b,0);
  const orientationScore=vals[4]+vals[5]+vals[6];
  const firstAidScore=vals[7];
  let level='principiante';
  if(score>=13 && orientationScore>=3 && vals[8]>=1 && vals[9]>=1) level='intermedio';
  const orientationLevel=orientationScore>=7?'avanzado':orientationScore>=4?'competente':'basico';
  const firstAidLevel=firstAidScore>=3?'formado':firstAidScore>=1?'basico':'ninguno';
  const preferredDistance=[7,12,20,30][vals[1]];
  const preferredElevation=[250,500,850,1200][vals[2]];
  const resultText=level==='principiante'
    ?'Resultado orientativo: priorizaremos rutas sencillas y bien señalizadas mientras tu experiencia real progresa.'
    :level==='intermedio'
      ?'Resultado orientativo: tienes una base útil, pero tu nivel real evolucionará con rutas y logros verificados.'
      :'Resultado orientativo: declaras experiencia sólida. El nivel Experto deberá ganarse con actividad o acreditarse y revisarse.';
  return {score,level,orientationLevel,firstAidLevel,preferredDistance,preferredElevation,resultText};
}

export default function HikerAssessment({user,onComplete}){
  const [step,setStep]=useState(0); const [answers,setAnswers]=useState({}); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [result,setResult]=useState(null);
  const q=questions[step]; const progress=Math.round(((step+(result?1:0))/questions.length)*100); const calculated=useMemo(()=>localResult(answers),[answers]);
  function choose(value){setAnswers(a=>({...a,[q.id]:value}));}
  async function next(){if(answers[q.id]===undefined)return; if(step<questions.length-1){setStep(s=>s+1);return;} setBusy(true);setError(''); const storedAnswers=Object.fromEntries(questions.map((question,index)=>[`q${index+1}`,answers[question.id]])); const completedAt=new Date().toISOString(); const {data,error}=await supabase.from('profiles').update({assessment_suggested_level:calculated.level,orientation_level:calculated.orientationLevel,first_aid_level:calculated.firstAidLevel,preferred_distance_km:calculated.preferredDistance,preferred_elevation_m:calculated.preferredElevation,assessment_completed:true,assessment_skipped:false,assessment_score:calculated.score,assessment_answers:storedAnswers,assessment_completed_at:completedAt,assessment_version:1,assessment_result_text:calculated.resultText,updated_at:completedAt}).eq('id',user.id).select('assessment_suggested_level,assessment_score').single(); setBusy(false); if(error){setError('No hemos podido guardar el test. Inténtalo de nuevo.');return;} setResult({suggested_level:data.assessment_suggested_level,score:data.assessment_score});}
  if(result){const level=(result.suggested_level||result.level||calculated.level);const badge=level==='intermedio'?'/badges/intermedio-camaleon.webp':'/badges/principiante-lagartija.webp';return <div className="assessmentOverlay"><section className="assessmentCard resultCard badgeResultCard"><small>ORIENTACIÓN COMPLETADA</small><img className={`levelBadge levelBadge-${level}`} src={badge} alt={`Insignia ${level}`}/><h1 className="badgeLevelName">{level.toUpperCase()}</h1><p>{level==='principiante'?'Empezaremos con rutas accesibles, bien señalizadas y con más apoyo de preparación y seguridad.':level==='intermedio'?'Tienes una buena base. Podremos proponerte rutas de dificultad media y ayudarte a ganar autonomía.':'Tienes una buena base. Podremos proponerte rutas de dificultad media y ayudarte a ganar autonomía.'}</p><div className="assessmentResultGrid"><span>Puntuación <b>{result.assessment_score ?? result.score ?? calculated.score}</b></span><span>Tu nivel real evolucionará con tus <b>rutas y logros</b></span></div><button onClick={()=>onComplete?.(level)}>Entrar en Encúmbrate</button></section></div>}
  return <div className="assessmentOverlay"><section className="assessmentCard"><header><div><small>ENCÚMBRATE · TEST DE NIVEL</small><h1>Conozcamos tu experiencia</h1></div><b>{step+1}/{questions.length}</b></header><div className="assessmentProgress"><i style={{width:`${Math.max(8,progress)}%`}}/></div><p className="assessmentHint">No es un examen. Tus respuestas nos ayudan a recomendarte rutas acordes con tu experiencia y autonomía.</p><h2>{q.title}</h2><div className="assessmentOptions">{q.options.map(([label,value])=><button key={label} className={answers[q.id]===value?'selected':''} onClick={()=>choose(value)}><span>{label}</span><i>{answers[q.id]===value?'✓':''}</i></button>)}</div>{error&&<div className="assessmentError">{error}</div>}<footer>{step>0?<button className="secondary" onClick={()=>setStep(s=>s-1)}>Atrás</button>:<span/>}<button disabled={answers[q.id]===undefined||busy} onClick={next}>{busy?'Guardando…':step===questions.length-1?'Ver mi nivel':'Continuar'}</button></footer><div className="assessmentSafety">El nivel es orientativo. La dificultad real depende también de terreno, meteorología, estado físico y condiciones de cada ruta.</div></section></div>;
}
