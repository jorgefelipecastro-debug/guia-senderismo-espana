const DAY_MS = 24 * 60 * 60 * 1000;

export const AEMET_LEGACY_CUTOFF = '2026-10-15';
export const AEMET_WARNING_DAYS = 30;
export const AEMET_URGENT_DAYS = 7;

function validDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T23:59:59.999Z`) : new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function addCalendarMonths(date, months) {
  const source = new Date(date);
  const day = source.getUTCDate();
  const result = new Date(source);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function remainingDays(target, now) {
  return Math.ceil((target.getTime() - now.getTime()) / DAY_MS);
}

export function configuredAemetExpiry(env = process.env) {
  const explicit = validDate(env.AEMET_API_KEY_EXPIRES_AT);
  if (explicit) return { expiresAt: explicit.toISOString(), source: 'expires_at' };
  const created = validDate(env.AEMET_API_KEY_CREATED_AT);
  if (created) return { expiresAt: addCalendarMonths(created, 3).toISOString(), source: 'created_at' };
  return { expiresAt: null, source: null };
}

export function aemetKeyLifecycle({ keyPresent = true, expiresAt = null, expirySource = null, now = new Date() } = {}) {
  const clock = now instanceof Date ? now : new Date(now);
  const legacyCutoff = new Date(`${AEMET_LEGACY_CUTOFF}T00:00:00Z`);
  if (!keyPresent) return { state:'missing',severity:'critical',daysRemaining:null,expiresAt:null,expirySource,legacyCutoff:AEMET_LEGACY_CUTOFF,message:'No hay una API Key de AEMET configurada. El tiempo oficial no puede actualizarse.' };
  const expiry = validDate(expiresAt);
  if (expiry) {
    const daysRemaining = remainingDays(expiry, clock);
    if (daysRemaining < 0) return {state:'expired',severity:'critical',daysRemaining,expiresAt:expiry.toISOString(),expirySource,legacyCutoff:AEMET_LEGACY_CUTOFF,message:'La fecha registrada de la API Key de AEMET ya ha vencido. Renueva la credencial inmediatamente.'};
    if (daysRemaining <= AEMET_URGENT_DAYS) return {state:'expiring-urgent',severity:'critical',daysRemaining,expiresAt:expiry.toISOString(),expirySource,legacyCutoff:AEMET_LEGACY_CUTOFF,message:`La API Key de AEMET caduca en ${daysRemaining} día${daysRemaining===1?'':'s'}. Renueva la credencial ahora.`};
    if (daysRemaining <= AEMET_WARNING_DAYS) return {state:'expiring-soon',severity:'warning',daysRemaining,expiresAt:expiry.toISOString(),expirySource,legacyCutoff:AEMET_LEGACY_CUTOFF,message:`La API Key de AEMET caduca en ${daysRemaining} días. Programa su renovación antes de que interrumpa el servicio.`};
    return {state:'healthy',severity:'ok',daysRemaining,expiresAt:expiry.toISOString(),expirySource,legacyCutoff:AEMET_LEGACY_CUTOFF,message:`La caducidad de la API Key está controlada. Quedan ${daysRemaining} días.`};
  }
  const daysToLegacyCutoff = remainingDays(legacyCutoff, clock);
  return {state:'unknown-expiry',severity:'warning',daysRemaining:null,expiresAt:null,expirySource:null,legacyCutoff:AEMET_LEGACY_CUTOFF,daysToLegacyCutoff,message:daysToLegacyCutoff>=0?`La fecha de caducidad de esta clave no está registrada. Las claves antiguas sin expiración dejarán de aceptarse el ${AEMET_LEGACY_CUTOFF}.`:'La fecha de caducidad de esta clave no está registrada. Registra la fecha para poder avisar antes de la próxima renovación trimestral.'};
}

export async function probeAemetCredential({ fetcher = fetch, key = process.env.AEMET_API_KEY, now = new Date() } = {}) {
  const credential = String(key || '').trim();
  const checkedAt = (now instanceof Date ? now : new Date(now)).toISOString();
  if (!credential) return { status:'missing',checkedAt,httpStatus:null };
  let response;
  try { response = await fetcher('https://opendata.aemet.es/opendata/api/maestro/municipios',{headers:{api_key:credential,Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'error',cache:'no-store'}); }
  catch { return { status:'unavailable',checkedAt,httpStatus:null }; }
  let envelope=null; try{envelope=await response.json();}catch{}
  const envelopeStatus=Number(envelope?.estado);
  if(response.status===401||envelopeStatus===401)return{status:'unauthorized',checkedAt,httpStatus:401};
  if(response.status===429||envelopeStatus===429)return{status:'rate_limited',checkedAt,httpStatus:429};
  if(response.status===403||envelopeStatus===403)return{status:'forbidden',checkedAt,httpStatus:403};
  if(response.ok&&envelopeStatus===200)return{status:'ok',checkedAt,httpStatus:response.status};
  return{status:'unavailable',checkedAt,httpStatus:response.status||null};
}
