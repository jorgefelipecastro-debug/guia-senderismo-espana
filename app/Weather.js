'use client';
import {useEffect,useRef,useState} from 'react';
import {weatherCoordinates,weatherLabel,weatherAdvice,validWeatherCache,daylightHours} from '../lib/weather';
import './weather.css';
import WeatherHomeCard from './WeatherHomeCard';

const format = (value,unit='') => Number.isFinite(value) ? `${Math.round(value*10)/10}${unit}` : '—';
const clock = value => value?.slice(11,16) || '—';
const CACHE = 'encumbrate:weather:aemet:v1';
function readCache(key) {try {const cache=JSON.parse(localStorage.getItem(CACHE)||'{}');return validWeatherCache(cache[key]) ? cache[key] : null;} catch {return null;}}
function saveCache(key,data) {try {const cache=JSON.parse(localStorage.getItem(CACHE)||'{}');cache[key]=data;const entries=Object.entries(cache).sort((a,b)=>Date.parse(b[1].fetchedAt)-Date.parse(a[1].fetchedAt)).slice(0,12);localStorage.setItem(CACHE,JSON.stringify(Object.fromEntries(entries)));} catch {}}

export default function Weather({route}) {
  const [place,setPlace]=useState(null),[open,setOpen]=useState(false),[data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[refresh,setRefresh]=useState(0),[locationError,setLocationError]=useState(''),[locationMode,setLocationMode]=useState('gps');
  const coordinates=route ? weatherCoordinates(route.lat,route.lon) : weatherCoordinates(place?.lat,place?.lon);
  const key=coordinates ? `${coordinates.lat},${coordinates.lon}` : '';
  useEffect(()=>{
    if(route||locationMode!=='gps')return;
    if(!navigator.geolocation){setLocationError('Tu navegador no permite localizarte. Elige una localidad.');return;}
    let active=true,blocked=false,pending=false;
    const locate=()=>{
      if(!active||blocked||pending||document.visibilityState==='hidden')return;
      pending=true;
      navigator.geolocation.getCurrentPosition(position=>{
        pending=false;if(!active)return;
        const next=weatherCoordinates(position.coords.latitude,position.coords.longitude);
        if(!next)return;
        setLocationError('');
        setPlace(previous=>previous?.lat===next.lat&&previous?.lon===next.lon?previous:{...next,name:'Tu ubicación actual'});
      },failure=>{
        pending=false;if(!active)return;
        if(failure.code===1)blocked=true;
        setLocationError(failure.code===1?'Permite la ubicación o elige una localidad.':'No se ha podido actualizar tu ubicación. Puedes elegir una localidad.');
      },{enableHighAccuracy:false,maximumAge:120000,timeout:12000});
    };
    locate();const timer=setInterval(locate,300000);
    document.addEventListener('visibilitychange',locate);
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',locate);};
  },[route,locationMode]);
  useEffect(()=>{
    if(!key){setData(null);return;}
    const controller=new AbortController();let active=true;
    setData(readCache(key));setLoading(true);setError('');
    const timeout=setTimeout(()=>controller.abort(),55000);
    fetch(`/api/weather?lat=${coordinates.lat}&lon=${coordinates.lon}`,{signal:controller.signal}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);if(!Array.isArray(result.hours)||!result.days?.length)throw new Error('Previsión incompleta.');if(active){setData(result);saveCache(key,result);}}).catch(error=>{if(active)setError(error.name==='AbortError'?'AEMET está tardando demasiado. Vuelve a intentarlo.':error.message||'No se pudo actualizar la previsión.');}).finally(()=>{clearTimeout(timeout);if(active)setLoading(false);});
    return()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[key,refresh]);
  function choosePlace(value){setLocationError('');setLocationMode(value.name==='Mi ubicación aproximada'?'gps':'manual');setPlace(value);}
  return <><WeatherHomeCard route={route} data={data} place={place} loading={loading} error={error||locationError} onOpen={()=>setOpen(true)} onRefresh={()=>setRefresh(n=>n+1)}/>
    {open&&<WeatherDetail close={()=>setOpen(false)} route={route} place={place} choosePlace={choosePlace} data={data} error={error} loading={loading} retry={()=>setRefresh(n=>n+1)} hasCoordinates={!!key}/>}
  </>;
}

function WeatherDetail({close,route,place,choosePlace,data,error,loading,retry,hasCoordinates}) {
  const dialog=useRef(null),[query,setQuery]=useState(''),[places,setPlaces]=useState([]),[searchError,setSearchError]=useState(''),[searching,setSearching]=useState(false),[day,setDay]=useState(''),[start,setStart]=useState('08:00'),[end,setEnd]=useState('18:00');
  const searchController=useRef(null);
  useEffect(()=>{const el=dialog.current;el.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{searchController.current?.abort();document.body.style.overflow=previous;el.close();};},[]);
  const selectedDay=data?.days.some(d=>d.date===day)?day:data?.days[0]?.date;
  const hours=data?.hours.filter(h=>h.time.startsWith(selectedDay)) || [];
  const selected=data?.days.find(d=>d.date===selectedDay);
  const invalidTime=end<=start;
  const outing=invalidTime?[]:hours.filter(h=>clock(h.time)>=start&&clock(h.time)<=end);
  const advice=weatherAdvice(outing);
  if(!invalidTime && selected?.sunset && end>clock(selected.sunset))advice.push('La hora de regreso elegida es posterior al atardecer: ajusta la salida y lleva frontal.');
  async function search(event){event.preventDefault();searchController.current?.abort();const controller=new AbortController();searchController.current=controller;const timer=setTimeout(()=>controller.abort(),28000);setSearching(true);setSearchError('');setPlaces([]);try {const response=await fetch(`/api/weather/places?q=${encodeURIComponent(query.trim())}`,{signal:controller.signal});const result=await response.json();if(!response.ok)throw new Error(result.error);if(searchController.current===controller){setPlaces(result.places);if(!result.places.length)setSearchError('No se han encontrado localidades.');}}catch {if(searchController.current===controller)setSearchError('No se pudo buscar. Comprueba la conexión.');}finally {clearTimeout(timer);if(searchController.current===controller)setSearching(false);}}
  function locate(){if(!navigator.geolocation){setSearchError('Este navegador no permite consultar tu ubicación. Busca una localidad.');return;}setSearchError('Buscando tu ubicación…');navigator.geolocation.getCurrentPosition(p=>{choosePlace({lat:p.coords.latitude,lon:p.coords.longitude,name:'Mi ubicación aproximada'});setSearchError('');},()=>setSearchError('No hemos podido acceder a tu ubicación. Puedes buscar una localidad.'),{timeout:10000,maximumAge:300000});}
  return <dialog ref={dialog} className="weatherDialog" onCancel={event=>{event.preventDefault();close();}} aria-labelledby="weatherTitle">
    <header><div><small>ENCÚMBRATE · METEOROLOGÍA</small><h2 id="weatherTitle">{route?.name || place?.name || 'El tiempo'}</h2></div><button onClick={close} aria-label="Cerrar el tiempo">×</button></header>
    <main>
      {!route&&<section><button onClick={locate}>Usar mi ubicación</button><form onSubmit={search}><label htmlFor="weatherPlace">Buscar localidad de España</label><div className="weatherSearch"><input id="weatherPlace" value={query} onChange={e=>setQuery(e.target.value)} minLength={2} maxLength={80} required placeholder="Por ejemplo, Alicante"/><button disabled={searching}>{searching?'Buscando…':'Buscar'}</button></div></form>{searchError&&<p role="status">{searchError}</p>}<div className="weatherPlaces">{places.map(p=><button key={p.id} onClick={()=>{choosePlace(p);setPlaces([]);}}>{p.name}</button>)}</div></section>}
      {route&&!hasCoordinates&&<p>Esta ruta no tiene coordenadas disponibles para consultar una previsión fiable.</p>}
      {loading&&<p role="status">Actualizando previsión…</p>}{error&&<p role="status">{error}</p>}
      {hasCoordinates&&<button onClick={retry} disabled={loading}>Actualizar previsión</button>}
      {data&&<>
        <p className="weatherNotice">{error?'Última previsión guardada. ':''}Consultada: {new Date(data.fetchedAt).toLocaleString('es-ES')}. {Date.now()-Date.parse(data.fetchedAt)>10800000?'Datos antiguos: actualiza antes de salir. ':''}Referencia: {data.municipality}, a {format(data.distanceKm,' km')} del punto consultado. Horas locales de {data.timezone}. Las condiciones pueden variar con la altitud y a lo largo del recorrido.</p>
        <div className="weatherCurrent"><strong>{format(data.current.temperature,'°C')}</strong><span>{weatherLabel(data.current.code)} · Viento {format(data.current.wind,' km/h')}<small>Previsión municipal AEMET · {clock(data.current.time)} · Altitud del municipio {format(data.elevation,' m')}</small></span></div>
        <h3>Elige el día de tu salida</h3><div className="weatherDays">{data.days.map(d=><button key={d.date} aria-pressed={selectedDay===d.date} onClick={()=>setDay(d.date)}><b>{d.date.slice(8)}/{d.date.slice(5,7)}</b><span>{weatherLabel(d.code)}</span><strong>{format(d.min,'°')} / {format(d.max,'°')}</strong><small>Lluvia {format(d.rainProbability,'%')}</small></button>)}</div>
        <p>Amanecer <b>{clock(selected?.sunrise)}</b> · Atardecer <b>{clock(selected?.sunset)}</b> · Luz diurna <b>{format(daylightHours(selected?.sunrise,selected?.sunset),' h')}</b> · UV máximo <b>{format(selected?.uv)}</b></p>
        <section className="weatherAdvice"><h3>Qué tener en cuenta para tu salida</h3><div className="weatherSearch"><label>Salida <input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Regreso el mismo día <input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>{invalidTime?<p>El regreso debe ser posterior a la salida.</p>:advice.length?<ul>{advice.map(text=><li key={text}>{text}</li>)}</ul>:<p>Revisa la previsión por horas y los avisos oficiales. Este resumen no confirma que la ruta sea segura.</p>}<small>Orientaciones calculadas con el pronóstico disponible, no avisos oficiales. Si faltan horas, el resumen no cubre toda tu salida.</small></section>
        <h3>Previsión por horas</h3><p>Las probabilidades de lluvia corresponden al intervalo indicado por AEMET. Los campos sin datos se muestran con —.</p>{!hours.length&&<p>AEMET no ofrece detalle horario para este día. Consulta la previsión diaria.</p>}<div className="weatherTable" tabIndex={0} role="region" aria-label="Previsión horaria, desplaza horizontalmente para ver todos los datos"><table><thead><tr>{['Hora','Cielo','Temperatura','Sensación','Lluvia % por intervalo','Intervalo lluvia','Agua mm','Nieve cm','Viento km/h','Rachas km/h','Dirección °','Visibilidad km','Nubes %','UV'].map(t=><th key={t} scope="col">{t}</th>)}</tr></thead><tbody>{hours.map(h=><tr key={h.time}><th scope="row">{clock(h.time)}</th><td>{weatherLabel(h.code)}</td>{[h.temperature,h.feels,h.rainProbability,h.rainPeriod,h.rain,h.snow,h.wind,h.gust,h.windDirection,h.visibility===null?null:h.visibility/1000,h.cloud,h.uv].map((v,i)=><td key={i}>{i===3?(v?`${v.slice(0,2)}–${v.slice(2)} h`:"—"):format(v)}</td>)}</tr>)}</tbody></table></div>
      </>}
      <section><h3>Avisos oficiales</h3><p>Consulta los avisos vigentes para la zona y la predicción de montaña. Los avisos oficiales no se descargan en esta pantalla.</p><p><a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener noreferrer">Avisos de AEMET ↗</a></p><a href="https://www.aemet.es/es/eltiempo/prediccion/montana" target="_blank" rel="noopener noreferrer">Predicción de montaña de AEMET ↗</a></section>
      <footer>Datos meteorológicos: <a href="https://www.aemet.es/" target="_blank" rel="noopener noreferrer">AEMET</a> · <a href="https://www.aemet.es/es/nota_legal" target="_blank" rel="noopener noreferrer">Condiciones de reutilización</a>. Se conservan hasta 12 previsiones consultadas en este navegador para su lectura sin conexión. Esto no garantiza el arranque de toda la aplicación offline.</footer>
    </main>
  </dialog>;
}
