'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {progressionFor} from '../lib/progressionBadges';
import './profile-passport.css';
import './profile-passport-effects.css';

const nf=new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});
const date=value=>value?new Date(value).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'—';

export default function ProfilePassport({user,avatar,badge,onClose,onEditAvatar}){
 const[loading,setLoading]=useState(true),[error,setError]=useState(''),[profile,setProfile]=useState(null),[alias,setAlias]=useState(''),[activities,setActivities]=useState([]),[achievements,setAchievements]=useState([]),[submissions,setSubmissions]=useState([]);
 useEffect(()=>{let active=true;async function load(){setLoading(true);setError('');const results=await Promise.all([
  supabase.from('profiles').select('progression_level,progression_badge,progression_xp,completed_routes,total_distance_km,total_elevation_gain_m,approved_route_contributions,contributor_xp,accredited_level,avatar_display').eq('id',user.id).maybeSingle(),
  supabase.from('social_aliases').select('alias').eq('user_id',user.id).maybeSingle(),
  supabase.from('route_activities').select('id,route_name,route_difficulty,status,distance_km,elevation_gain_m,duration_seconds,trophy_earned,ended_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1000),
  supabase.from('social_achievement_posts').select('id,title,description,badge_icon,achievement_key,achieved_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30),
  supabase.from('user_route_submissions').select('id,name,status,distance_km,ascent_m,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
 ]);if(!active)return;setProfile(results[0].data||{});setAlias(results[1].data?.alias||'');setActivities(results[2].data||[]);setAchievements(results[3].data||[]);setSubmissions(results[4].data||[]);if(results.some(result=>result.error))setError('Algunos datos no se han podido actualizar. Mostramos la información disponible.');setLoading(false)}load();return()=>{active=false}},[user.id]);
 const completed=useMemo(()=>activities.filter(item=>item.status==='completed'&&item.trophy_earned),[activities]),hours=completed.reduce((sum,item)=>sum+Number(item.duration_seconds||0),0)/3600,xp=Number(profile?.progression_xp||0),mountain=progressionFor(xp,{expertUnlocked:profile?.accredited_level==='experto',approvedRoutes:Number(profile?.approved_route_contributions||0)}),next=mountain.next,progress=Math.round(mountain.progress),name=(user.user_metadata?.name||alias||'Senderista').trim(),memberSince=date(user.created_at);
 const leaveAnd=event=>{onClose();requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent(event)))};
 return <div className="profilePassport" role="dialog" aria-modal="true" aria-label="Mi perfil de Encúmbrate">
  <header className="profileTop"><button onClick={onClose} aria-label="Volver">‹</button><div><small>PASAPORTE DE MONTAÑA</small><strong>Mi perfil</strong></div><button onClick={onEditAvatar} aria-label="Editar imagen">✎</button></header>
  <main>
   <section className="profileHero"><div className="profileGlow"/><button className="profileAvatar" onClick={onEditAvatar}>{avatar?<img src={avatar} alt="Imagen del perfil"/>:<span>♙</span>}<i>✎</i></button><div className="profileIdentity"><small>PASAPORTE ACTIVO</small><h1>{name}</h1><p>{alias?`@${alias}`:'Configura tu alias en la red social'}</p><div><span>{(profile?.progression_badge||profile?.progression_level||'principiante').replaceAll('-',' ')}</span><b>{xp.toLocaleString('es-ES')} XP</b></div></div>{badge&&<div className="profileBadgeStage" aria-label="Insignia actual"><span className="profileBadgeLight"><i/><i/><i/></span><img className="profileBadge" src={badge} alt="Insignia actual"/></div>}</section>
   {loading?<div className="profileLoading"><i/><span>Preparando tu pasaporte…</span></div>:<>
    {error&&<p className="profileNotice">{error}</p>}
    <section className="profileStats"><article><b>{Number(profile?.completed_routes||completed.length).toLocaleString('es-ES')}</b><span>Rutas</span></article><article><b>{nf.format(Number(profile?.total_distance_km||0))}</b><span>km</span></article><article><b>{Number(profile?.total_elevation_gain_m||0).toLocaleString('es-ES')}</b><span>m ascendidos</span></article><article><b>{nf.format(hours)}</b><span>horas GPS</span></article></section>
    <section className="profileProgress">{next&&<img className="profileNextBadge" src={next.asset} alt={`Próxima insignia: ${next.label}`}/>}<div><small>PRÓXIMO RETO</small><h2>{next?next.label:'Máximo nivel alcanzado'}</h2><p>{next?`${mountain.xpRemaining.toLocaleString('es-ES')} XP para desbloquearlo`:'Tu experiencia sigue creciendo'}</p></div><strong>{progress}%</strong><span><i style={{width:`${progress}%`}}/></span></section>
    <Section title="Logros e insignias" action="Ver progreso" onAction={()=>leaveAnd('encumbrate:open-badges')}><div className="profileAchievements">{achievements.length?achievements.slice(0,6).map(item=><article key={item.id}><span>{item.badge_icon||'🏅'}</span><div><b>{item.title}</b><small>{date(item.achieved_at||item.created_at)}</small></div></article>):<Empty icon="◇" text="Tus próximos logros aparecerán aquí"/>}</div></Section>
    <Section title="Actividad reciente" action="Todas mis rutas" onAction={()=>leaveAnd('encumbrate:open-route-history')}><div className="profileTimeline">{activities.length?activities.slice(0,4).map(item=><article key={item.id}><i className={item.trophy_earned?'done':'pending'}>{item.trophy_earned?'✓':'!'}</i><div><b>{item.route_name||'Ruta registrada'}</b><small>{date(item.ended_at||item.created_at)} · {nf.format(Number(item.distance_km||0))} km · +{Number(item.elevation_gain_m||0).toLocaleString('es-ES')} m</small></div></article>):<Empty icon="⌖" text="Inicia una ruta para crear tu historial GPS"/>}</div></Section>
    <Section title="Contribuciones a Encúmbrate"><div className="profileContribution"><div><strong>{Number(profile?.approved_route_contributions||0)}</strong><span>rutas aprobadas</span></div><div><strong>{Number(profile?.contributor_xp||0)}</strong><span>XP colaborador</span></div><div><strong>{submissions.filter(item=>item.status==='pending').length}</strong><span>en revisión</span></div></div><button className="profilePrimary" onClick={()=>{onClose();window.dispatchEvent(new CustomEvent('encumbrate:propose-route'))}}>Proponer una nueva ruta</button></Section>
    <Section title="Comunidad y seguridad"><div className="profileMenu"><button onClick={()=>leaveAnd('encumbrate:open-meetups')}><span>♧</span><div><b>Red social y quedadas</b><small>Chats, grupos y próximas salidas</small></div><i>›</i></button><a href="/normas-comunidad?from=profile"><span>♢</span><div><b>Normas de la comunidad</b><small>Convivencia, denuncias y moderación</small></div><i>›</i></a><a href="/privacidad?from=profile"><span>⌾</span><div><b>Privacidad y seguridad</b><small>Permisos, datos y protección de cuenta</small></div><i>›</i></a></div></Section>
    <section className="profileAccount"><small>CUENTA PRIVADA</small><b>{user.email}</b><span>Miembro desde {memberSince}</span><div><a href="/eliminar-cuenta">Gestionar o eliminar cuenta</a><button onClick={()=>supabase.auth.signOut()}>Cerrar sesión</button></div></section>
   </>}
  </main>
 </div>
}

function Section({title,action,onAction,children}){return <section className="profileSection"><header><h2>{title}</h2>{action&&<button onClick={onAction}>{action}</button>}</header>{children}</section>}
function Empty({icon,text}){return <div className="profileEmpty"><span>{icon}</span><p>{text}</p></div>}
