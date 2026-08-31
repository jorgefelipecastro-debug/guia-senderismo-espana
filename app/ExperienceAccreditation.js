'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './experience-accreditation.css';
import './progression-badges.css';
import './verified-progression.css';
import { PROGRESSION, progressionFor } from '../lib/progressionBadges';

const DECLARATION_VERSION = '2026-08-25-v1';

const evidenceOptions = [
  ['historial_rutas', 'Historial de rutas'],
  ['licencia_federativa', 'Licencia federativa'],
  ['certificado', 'Certificado o formación'],
  ['tracks_gps', 'Tracks GPS'],
  ['otra', 'Otra acreditación']
];

export default function ExperienceAccreditation({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState({
    requestedLevel: 'experto',
    evidenceType: 'historial_rutas',
    evidenceSummary: '',
    evidenceLinks: '',
    expertRequirements: {
      progress_history: false,
      first_aid: false,
      orientation_safety: false,
      independent_evidence: false
    },
    accepted: false
  });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mountainProgress, setMountainProgress] = useState({xp:0, expertUnlocked:false, approvedRoutes:0});
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [profileResult, requestResult] = await Promise.all([
        supabase.from('profiles')
          .select('progression_level,progression_badge,progression_xp,completed_routes,total_distance_km,total_elevation_gain_m,approved_route_contributions,accredited_level,level_source,assessment_suggested_level')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('experience_accreditation_requests')
          .select('id,requested_level,evidence_type,status,created_at,review_notes')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);
      if (!active) return;
      if (profileResult.error || requestResult.error) {
        setError('No hemos podido cargar tu información de nivel.');
      } else {
        setProfile(profileResult.data);
        setMountainProgress({
          xp:Number(profileResult.data?.progression_xp||0),
          expertUnlocked:profileResult.data?.accredited_level==='experto',
          approvedRoutes:Number(profileResult.data?.approved_route_contributions||0)
        });
        const loadedLevel = profileResult.data?.level_source === 'accreditation' && profileResult.data?.accredited_level
          ? profileResult.data.accredited_level
          : profileResult.data?.progression_level || 'principiante';
        setForm(current => ({...current, requestedLevel: loadedLevel === 'principiante' ? 'intermedio' : 'experto'}));
        setRequest(requestResult.data);
      }
      setBusy(false);
    }
    load();
    return () => { active = false; };
  }, [user.id]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (form.evidenceSummary.trim().length < 30) {
      return setError('Describe tu experiencia con al menos 30 caracteres.');
    }
    if (!form.accepted) {
      return setError('Debes leer y aceptar la declaración responsable.');
    }
    if (form.requestedLevel === 'experto' && !Object.values(form.expertRequirements).every(Boolean)) {
      return setError('Para solicitar Experto debes confirmar los cinco requisitos. Después comprobaremos cada prueba.');
    }
    setBusy(true);
    const { data, error: insertError } = await supabase
      .from('experience_accreditation_requests')
      .insert({
        user_id: user.id,
        requested_level: form.requestedLevel,
        evidence_type: form.evidenceType,
        evidence_summary: form.evidenceSummary.trim(),
        evidence_links: form.evidenceLinks.trim() || null,
        expert_requirements: form.requestedLevel === 'experto' ? {
          ...form.expertRequirements,
          responsible_declaration: form.accepted
        } : {},
        declaration_version: DECLARATION_VERSION,
        declaration_accepted: true
      })
      .select('id,requested_level,evidence_type,status,created_at,review_notes')
      .single();
    setBusy(false);
    if (insertError) {
      if (insertError.code === '23505') {
        return setError('Ya tienes una solicitud pendiente de revisión.');
      }
      return setError('No hemos podido enviar la solicitud. Inténtalo de nuevo.');
    }
    setRequest(data);
    setNotice('Solicitud enviada. Tu nivel no cambiará hasta que la experiencia sea revisada.');
  }

  const currentLevel = profile?.level_source === 'accreditation' && profile?.accredited_level
    ? profile.accredited_level
    : profile?.progression_level || 'principiante';
  const badgeByLevel = {
    principiante:'/badges/principiante-lagartija.webp',
    intermedio:'/badges/intermedio-camaleon.webp',
    experto:'/badges/experto-serpiente.webp'
  };
  const currentBadge = badgeByLevel[currentLevel] || badgeByLevel.principiante;
  const journey = progressionFor(mountainProgress.xp, mountainProgress);

  return <div className="accreditationOverlay" role="dialog" aria-modal="true" aria-labelledby="accreditation-title">
    <section className="accreditationCard">
      <header>
        <div>
          <small>PERFIL DE MONTAÑA</small>
          <h1 id="accreditation-title">Nivel y experiencia</h1>
        </div>
        <button type="button" className="accreditationClose" onClick={onClose} aria-label="Cerrar">×</button>
      </header>

      {busy && !profile ? <p>Cargando…</p> : <>
        <div className="profileLevelBadge"><img src={currentBadge} alt={`Insignia ${currentLevel}`}/><strong>{currentLevel.toUpperCase()}</strong></div>
        <section className="mountainProgress" aria-label="Progresión de insignias">
          <div className="mountainProgressHero">
            <img src={journey.current.asset} alt={`Insignia ${journey.current.label}`}/>
            <div><small>TU INSIGNIA ACTUAL</small><h2>{journey.current.label}</h2><strong>{journey.points.toLocaleString('es-ES')} XP acumulados</strong></div>
          </div>
          {journey.next && <div className="nextBadgeProgress">
            <div className="nextBadgeCopy"><span>Siguiente: <b>{journey.next.label}</b></span><span>{journey.xpRemaining > 0 ? `Te faltan ${journey.xpRemaining.toLocaleString('es-ES')} XP` : 'XP completados · revisa los requisitos'}</span></div>
            <div className="xpTrack"><i style={{width:`${journey.progress}%`}}/></div>
            {journey.next.requirements?.length > 0 && <ul>{journey.next.requirements.map(item=><li key={item}>{item}</li>)}</ul>}
          </div>}
          <div className="badgeRoadmap">
            {PROGRESSION.map(badge=>{
              const unlocked=PROGRESSION.findIndex(item=>item.id===badge.id)<=PROGRESSION.findIndex(item=>item.id===journey.current.id);
              return <button type="button" className={unlocked?'unlocked':'locked'} key={badge.id} title={unlocked?'Conseguida':`${badge.xp.toLocaleString('es-ES')} XP`} onClick={()=>setSelectedBadge(badge)}>
                <img src={badge.asset} alt={badge.label}/><span>{badge.label}</span><small>{unlocked?'✓ Conseguida':`${badge.xp.toLocaleString('es-ES')} XP`}</small><em>Ver insignia</em>
              </button>
            })}
          </div>
          <p className="motivationCopy">{journey.next ? 'Cada ruta suma experiencia. Sigue explorando para desbloquear la siguiente insignia y alcanzar Maestro Encúmbrate.' : `Has alcanzado Maestro Encúmbrate. Tus ${journey.points.toLocaleString('es-ES')} XP siguen acumulándose sin límite y quedan guardados como histórico para futuras insignias.`}</p>
          <div className="verifiedProgressStats"><div><b>{Number(profile?.completed_routes||0).toLocaleString('es-ES')}</b><small>Rutas verificadas</small></div><div><b>{Number(profile?.total_distance_km||0).toLocaleString('es-ES',{maximumFractionDigits:1})} km</b><small>Distancia registrada</small></div><div><b>{Number(profile?.total_elevation_gain_m||0).toLocaleString('es-ES')} m</b><small>Desnivel acumulado</small></div></div>
        </section>
        {selectedBadge&&<BadgeDetail badge={selectedBadge} progress={mountainProgress} close={()=>setSelectedBadge(null)}/>}
        <div className="levelSummary">
          <div><small>Nivel actual</small><strong>{currentLevel}</strong></div>
          <div><small>Orientación del test</small><strong>{profile?.assessment_suggested_level || 'Sin completar'}</strong></div>
          <div><small>Origen</small><strong>{profile?.level_source === 'accreditation' ? 'Experiencia acreditada' : 'Progreso en Encúmbrate'}</strong></div>
        </div>

        <p className="accreditationIntro">
          El test solo orienta las recomendaciones iniciales. Tu nivel real aumenta mediante rutas y logros registrados.
          Si ya tienes experiencia previa, puedes solicitar que la revisemos.
        </p>

        {request?.status === 'pending' ? <div className="pendingRequest">
          <strong>Solicitud pendiente</strong>
          <p>Has solicitado el nivel <b>{request.requested_level}</b>. No se concederá automáticamente: revisaremos la información aportada.</p>
        </div> : currentLevel === 'experto' ? <div className="pendingRequest"><strong>Nivel Experto acreditado</strong><p>Ya tienes el nivel máximo general de Encúmbrate. Las futuras especialidades aparecerán aquí.</p></div> : <form onSubmit={submit}>
          <label>Nivel solicitado
            <select value={form.requestedLevel} onChange={e => setForm({...form, requestedLevel:e.target.value})}>
              {currentLevel === 'principiante' && <option value="intermedio">Intermedio</option>}
              <option value="experto">Experto</option>
            </select>
          </label>

          <label>Tipo de acreditación
            <select value={form.evidenceType} onChange={e => setForm({...form, evidenceType:e.target.value})}>
              {evidenceOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          {form.requestedLevel === 'experto' && <section className="expertRequirements" aria-labelledby="expert-requirements-title">
            <div className="expertRequirementsHead">
              <span className="expertSerpent">◉</span>
              <div><small>SERPIENTE — EXPERTO</small><h2 id="expert-requirements-title">Cinco requisitos obligatorios</h2></div>
            </div>
            {[
              ['progress_history','Historial deportivo mínimo','50 rutas verificadas, 600 km, 20.000 m de desnivel, 30 recorridos diferentes y seis meses de actividad.'],
              ['first_aid','Primeros auxilios','Certificado verificable y actualizado en RCP, emergencias, traumatismos y atención inicial.'],
              ['orientation_safety','Orientación y seguridad','Formación acreditada en orientación, GPS, meteorología, planificación y gestión del riesgo.'],
              ['independent_evidence','Dos evidencias independientes','Pruebas verificables y vinculadas inequívocamente con tu identidad.']
            ].map(([key,title,description],index)=><label className="expertRequirement" key={key}>
              <input type="checkbox" checked={form.expertRequirements[key]} onChange={e=>setForm({...form,expertRequirements:{...form.expertRequirements,[key]:e.target.checked}})}/>
              <span><b>{index+1}. {title}</b><small>{description}</small></span>
            </label>)}
            <div className="expertRequirement declarationRequirement"><span className="requirementNumber">5</span><span><b>Declaración responsable</b><small>Se confirma en el apartado inferior y también es obligatoria.</small></span></div>
            <aside className="fedmeTraining">
              <strong>¿Necesitas formación?</strong>
              <p>Consulta los canales oficiales. Encúmbrate facilita el acceso, pero no pertenece a FEDME ni comparte tus datos con ella.</p>
              <div>
                <a href="https://fedme.es/escuela-espanola-alta-montana/formacion/" target="_blank" rel="noopener noreferrer">Ver formación FEDME/EEAM ↗</a>
                <a href="https://fedme.es/federaciones-autonomicas/" target="_blank" rel="noopener noreferrer">Federaciones autonómicas ↗</a>
              </div>
            </aside>
          </section>}

          <label>Describe tu experiencia
            <textarea rows="5" maxLength="3000" value={form.evidenceSummary}
              onChange={e => setForm({...form, evidenceSummary:e.target.value})}
              placeholder="Rutas realizadas, años de experiencia, formación, terrenos y condiciones habituales…"/>
          </label>

          <label>Enlaces a evidencias <span>(opcional)</span>
            <textarea rows="2" value={form.evidenceLinks}
              onChange={e => setForm({...form, evidenceLinks:e.target.value})}
              placeholder="Tracks GPS, historial público, licencia o certificado verificable…"/>
          </label>

          <div className="responsibilityBox">
            <strong>Declaración responsable</strong>
            <p>Declaro que la información aportada es veraz. Comprendo que el nivel solicitado no sustituye mi valoración personal de cada ruta ni garantiza que tenga la preparación física, técnica o material necesaria. Antes de iniciar una actividad debo comprobar recorrido, desnivel, terreno, meteorología, equipamiento y riesgos. Si realizo una ruta que supera mis capacidades, asumo las consecuencias derivadas de mi decisión, sin perjuicio de las responsabilidades que legalmente correspondan a Encúmbrate.</p>
            <label className="acceptDeclaration">
              <input type="checkbox" checked={form.accepted} onChange={e => setForm({...form,accepted:e.target.checked})}/>
              <span>He leído y acepto esta declaración responsable.</span>
            </label>
          </div>

          {error && <div className="accreditationError">{error}</div>}
          {notice && <div className="accreditationNotice">{notice}</div>}
          <button className="accreditationSubmit" disabled={busy}>{busy ? 'Enviando…' : 'Solicitar revisión'}</button>
        </form>}
        {request?.status !== 'pending' && error && <div className="accreditationError">{error}</div>}
        {notice && request?.status === 'pending' && <div className="accreditationNotice">{notice}</div>}
      </>}
    </section>
  </div>;
}

function BadgeDetail({badge,progress,close}){
  const xp=Number(progress.xp||0),xpMet=xp>=badge.xp;
  const special=badge.id==='experto'?[{label:'Primeros auxilios acreditados',done:progress.expertUnlocked},{label:'Curso de brújula y orientación acreditado',done:progress.expertUnlocked}]:badge.id==='maestro-encumbrate'?[{label:'Cinco rutas propias aprobadas por Encúmbrate',done:Number(progress.approvedRoutes||0)>=5,detail:`${Math.min(5,Number(progress.approvedRoutes||0))} de 5 aprobadas`}]:[];
  const obtained=xpMet&&special.every(item=>item.done),missing=Math.max(0,badge.xp-xp),percent=badge.xp?Math.min(100,xp/badge.xp*100):100;
  return <div className="badgeDetailOverlay" role="dialog" aria-modal="true" aria-labelledby="badge-detail-title">
    <section className="badgeDetailCard">
      <button type="button" className="badgeDetailBack" onClick={close} aria-label="Volver">‹</button>
      <div className="badgeLight" aria-hidden="true"><i/><i/><i/></div>
      <div className="badgeFloat"><img src={badge.asset} alt={`Insignia ${badge.label}`}/></div>
      <small className="badgeDetailEyebrow">CAMINO ENCÚMBRATE</small>
      <h2 id="badge-detail-title">{badge.label}</h2>
      <span className={obtained?'badgeDetailStatus achieved':'badgeDetailStatus'}>{obtained?'✓ Insignia conseguida':'Insignia por desbloquear'}</span>
      <div className="badgeDetailProgress"><div><span>Tu progreso</span><b>{xp.toLocaleString('es-ES')} / {badge.xp.toLocaleString('es-ES')} XP</b></div><div className="badgeDetailTrack"><i style={{width:`${percent}%`}}/></div></div>
      <div className="badgeRequirements"><h3>Qué necesitas conseguir</h3><div className={xpMet?'done':''}><span>{xpMet?'✓':'1'}</span><p><strong>Alcanzar {badge.xp.toLocaleString('es-ES')} XP</strong><small>{xpMet?'Objetivo completado':`Te faltan ${missing.toLocaleString('es-ES')} XP. Cada ruta registrada suma experiencia.`}</small></p></div>{special.map((item,index)=><div className={item.done?'done':''} key={item.label}><span>{item.done?'✓':index+2}</span><p><strong>{item.label}</strong><small>{item.done?'Requisito completado':item.detail||'Presenta una acreditación verificable en tu perfil de montaña.'}</small></p></div>)}</div>
      <p className="badgeDetailMessage">{obtained?'Esta insignia ya forma parte de tu historia. Sigue acumulando XP para avanzar hacia la siguiente cumbre.':'Sigue explorando con seguridad. Cada recorrido completado te acerca a esta insignia.'}</p>
      <button type="button" className="badgeDetailClose" onClick={close}>Volver a mis insignias</button>
    </section>
  </div>
}
