'use client';
import {useEffect,useState} from 'react';
import {weatherLabel} from '../lib/weather';
import './weather-home.css';

const value=(n,unit='')=>Number.isFinite(n)?`${Math.round(n)}${unit}`:'—';
function localParts(date,timezone){
 return Object.fromEntries(new Intl.DateTimeFormat('es-ES',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
}
function WeatherScene({code,night}){
 const kind=weatherLabel(code),cloud=kind!=='Despejado',wet=kind==='Lluvia'||kind==='Tormenta',snow=kind==='Nieve';
 return <div className={`weatherSky ${cloud?'hasClouds':''} ${night?'isNight':''} ${wet?'isWet':''} ${snow?'isSnow':''} ${kind==='Sin datos'?'isUnknown':''}`} aria-hidden="true">
  <div className="weatherOrb"/><div className="weatherCloud back"/><div className="weatherCloud front"/>
  {(wet||snow)&&<div className="weatherDrops">{Array.from({length:7},(_,i)=><i key={i} style={{'--drop':i}}/>)}</div>}
 </div>;
}

export default function WeatherHomeCard({route,data,place,loading,error,onOpen,onRefresh}){
 const [now,setNow]=useState(null),[selectedTime,setSelectedTime]=useState(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 const timezone=data?.timezone;
 const parts=now?localParts(now,timezone):null;
 const today=parts?`${parts.year}-${parts.month}-${parts.day}`:'';
 const currentTime=parts?`${today}T${parts.hour}:00`:'';
 const upcoming=(data?.hours||[]).filter(h=>h.time>=currentTime).slice(0,8);
 const selected=upcoming.find(h=>h.time===selectedTime);
 const forecast=selected||data?.current;
 const forecastTime=forecast?.time||currentTime;
 const day=data?.days.find(d=>d.date===forecastTime.slice(0,10));
 const dayHour=forecastTime.slice(11,16);
 const night=day?.sunrise&&day?.sunset?(dayHour<day.sunrise.slice(11,16)||dayHour>=day.sunset.slice(11,16)):false;
 const condition=weatherLabel(forecast?.code);
 const theme=condition==='Lluvia'||condition==='Tormenta'?'rain':condition==='Nieve'?'snow':night?'night':condition==='Despejado'?'sun':'cloud';
 const stale=data&&now&&now.getTime()-Date.parse(data.fetchedAt)>10800000;
 const name=data?.municipality||place?.name||route?.name||'Tu próxima aventura';
 return <section className={`weatherHome theme-${theme}`} aria-label={route?`El tiempo en ${route.name}`:"El tiempo en Inicio"}>
  <div className="weatherHomeTop"><button onClick={onOpen} className="weatherLocation" aria-label={route?`Ver previsión de la ruta. ${name}`:`Elegir ubicación. ${name}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-7 7-12A7 7 0 0 0 5 9c0 5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg><span>{name}</span><span aria-hidden="true">⌄</span></button><button className="weatherRefresh" onClick={onRefresh} disabled={loading||!data} aria-label="Actualizar el tiempo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/></svg></button></div>
  <button className="weatherHomeMain" onClick={onOpen} aria-label="Abrir previsión meteorológica completa">
   <div className="weatherClock"><small>{selected?'PREVISIÓN POR HORAS':route?'TIEMPO EN LA RUTA · AEMET':'EL TIEMPO · AEMET'}</small><strong>{selected?selected.time.slice(11,16):parts?`${parts.hour}:${parts.minute}`:'—:—'}</strong><span>{selected?`${selected.time.slice(8,10)}/${selected.time.slice(5,7)} · Hora local`:now?new Intl.DateTimeFormat('es-ES',{timeZone:timezone,weekday:'short',day:'numeric',month:'short'}).format(now):'Prepara tu salida'}</span></div>
   <WeatherScene code={forecast?.code} night={night}/>
   <div className="weatherHomeReading"><div><strong>{value(forecast?.temperature,'°')}<span>C</span></strong><p>{data?condition:loading?'Consultando el cielo…':route?'Tiempo de la ruta':'Elige tu localidad'}</p></div><span className="weatherRange">{day?`Máx. ${value(day.max,'°')} · Mín. ${value(day.min,'°')}`:'Sol, lluvia y viento antes de salir'}</span></div>
  </button>
  {data&&<div className="weatherHomeMetrics"><span>Viento <b>{value(forecast?.wind,' km/h')}</b></span><span>{selected?'Lluvia por intervalo':'Lluvia del día'} <b>{value(selected?selected.rainProbability:day?.rainProbability,'%')}</b></span><span>Atardecer <b>{day?.sunset?.slice(11,16)||'—'}</b></span></div>}
  {upcoming.length>0&&<div className="weatherHourStrip" role="group" aria-label="Selecciona una hora para ver su previsión"><button aria-pressed={!selected} onClick={()=>setSelectedTime(null)}>Ahora</button>{upcoming.map(h=><button key={h.time} aria-pressed={selected?.time===h.time} onClick={()=>setSelectedTime(h.time)} aria-label={`${h.time.slice(8,10)}/${h.time.slice(5,7)}, ${h.time.slice(11,16)}, ${value(h.temperature,' grados')}, ${weatherLabel(h.code)}`}><span>{h.time.startsWith(today)?'Hoy':`${h.time.slice(8,10)}/${h.time.slice(5,7)}`} · {h.time.slice(11,16)}</span><b>{value(h.temperature,'°')}</b></button>)}</div>}
  <div className="weatherHomeBottom"><small role="status">{loading?'Actualizando…':error?error:stale?'Previsión antigua · actualiza antes de salir':data?`Consultado ${new Date(data.fetchedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:timezone})}`:route?'Previsión del municipio de referencia':'Selecciona una ubicación para consultar el tiempo'}</small><button onClick={onOpen}>Ver previsión <span aria-hidden="true">↗</span></button></div>
 </section>;
}
