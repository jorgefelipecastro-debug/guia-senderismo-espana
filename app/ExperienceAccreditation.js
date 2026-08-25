'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './experience-accreditation.css';

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
    accepted: false
  });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const [profileResult, requestResult] = await Promise.all([
        supabase.from('profiles')
          .select('progression_level,accredited_level,level_source,assessment_suggested_level')
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
    setBusy(true);
    const { data, error: insertError } = await supabase
      .from('experience_accreditation_requests')
      .insert({
        user_id: user.id,
        requested_level: form.requestedLevel,
        evidence_type: form.evidenceType,
        evidence_summary: form.evidenceSummary.trim(),
        evidence_links: form.evidenceLinks.trim() || null,
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
        </div> : <form onSubmit={submit}>
          <label>Nivel solicitado
            <select value={form.requestedLevel} onChange={e => setForm({...form, requestedLevel:e.target.value})}>
              <option value="intermedio">Intermedio</option>
              <option value="experto">Experto</option>
            </select>
          </label>

          <label>Tipo de acreditación
            <select value={form.evidenceType} onChange={e => setForm({...form, evidenceType:e.target.value})}>
              {evidenceOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

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
