import { configuredAemetExpiry, aemetKeyLifecycle, probeAemetCredential } from './aemet-key-health.js';
import { recordServerError } from './monitoring.js';

export async function aemetCredentialHealth({ env = process.env, fetcher = fetch, now = new Date(), record = true } = {}) {
  const keyPresent = Boolean(String(env.AEMET_API_KEY || '').trim());
  const expiry = configuredAemetExpiry(env);
  const lifecycle = aemetKeyLifecycle({ keyPresent, expiresAt: expiry.expiresAt, expirySource: expiry.source, now });
  const probe = await probeAemetCredential({ fetcher, key: env.AEMET_API_KEY, now });
  let severity = lifecycle.severity, state = lifecycle.state, message = lifecycle.message;
  if (probe.status === 'unauthorized' || probe.status === 'forbidden') {
    state = 'credential-rejected'; severity = 'critical';
    message = 'AEMET ha rechazado la API Key. Renueva la credencial y actualiza la configuración antes de que el tiempo oficial quede sin servicio.';
  } else if (probe.status === 'missing') {
    state = 'missing'; severity = 'critical'; message = 'No hay una API Key de AEMET configurada.';
  } else if (probe.status === 'unavailable' || probe.status === 'rate_limited') {
    message = `${lifecycle.message} La comprobación en línea no pudo confirmarse ahora mismo.`;
  }
  const result = {...lifecycle,state,severity,message,credentialStatus:probe.status,credentialHttpStatus:probe.httpStatus,checkedAt:probe.checkedAt};
  if (record && severity !== 'ok') {
    const error = new Error(state === 'credential-rejected' ? 'AEMET_AUTH' : `AEMET_KEY_${state.toUpperCase().replace(/-/g,'_')}`);
    await recordServerError(error,{source:'health',severity:severity==='critical'?'critical':'warning',route:'/api/admin/aemet-status',method:'GET',runtime:'nodejs'});
  }
  return result;
}
