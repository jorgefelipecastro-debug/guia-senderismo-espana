export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FLEET_EMAIL = 'flota@allzonelogistics.com';
const RESEND_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.ALLZONE_MAIL_FROM || 'Allzone Logistics <noreply@encumbrate.es>';
const MAX_PDF_BYTES = 6 * 1024 * 1024;

const sentCache = globalThis.__allzoneClaimSentCache || (globalThis.__allzoneClaimSentCache = new Map());

function respond(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function validEmail(value) {
  const email = clean(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function cleanId(value) {
  const id = clean(value, 96).replace(/[^a-zA-Z0-9_-]/g, '');
  return id || `claim-${Date.now()}`;
}

function esc(value) {
  return clean(value, 300).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function bodyHtml(meta, recipientType) {
  const heading = recipientType === 'fleet' ? 'Copia interna del parte de accidente' : 'Copia del parte de accidente';
  return `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#18322d;line-height:1.5"><div style="max-width:620px;margin:auto;border:1px solid #dce8e5;border-radius:14px;overflow:hidden"><div style="background:#087f73;color:white;padding:18px 22px"><b style="font-size:20px">ALLZONE LOGISTICS</b></div><div style="padding:22px"><h2 style="margin-top:0">${heading}</h2><p>Adjuntamos la Declaración Amistosa de Accidente generada y firmada desde la aplicación web de Allzone.</p><table style="border-collapse:collapse;width:100%;font-size:14px"><tr><td style="padding:6px 0"><b>Vehículo A</b></td><td>${esc(meta.aPlate)}</td></tr><tr><td style="padding:6px 0"><b>Vehículo B</b></td><td>${esc(meta.bPlate)}</td></tr><tr><td style="padding:6px 0"><b>Fecha</b></td><td>${esc(meta.date)} ${esc(meta.time)}</td></tr><tr><td style="padding:6px 0"><b>Lugar</b></td><td>${esc(meta.place)}</td></tr></table><p style="margin-top:18px">El PDF adjunto contiene <b>una sola página</b>: la copia del parte. Las fotografías del siniestro se gestionan por WhatsApp y no se adjuntan a este correo.</p><p style="font-size:12px;color:#65736f;margin-bottom:0">Para cualquier aclaración, responde a este correo y la comunicación se dirigirá al departamento de Flota.</p></div></div></body></html>`;
}

async function sendOne({ to, claimId, recipientType, pdfBase64, filename, meta }) {
  const cacheKey = `${claimId}:${recipientType}:${to}`;
  if (sentCache.has(cacheKey)) return { ok: true, duplicate: true, id: sentCache.get(cacheKey) };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `allzone-${claimId}-${recipientType}`.slice(0, 256),
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      reply_to: FLEET_EMAIL,
      subject: `Parte de accidente Allzone · A ${meta.aPlate || '-'} · B ${meta.bPlate || '-'}`,
      html: bodyHtml(meta, recipientType),
      attachments: [{ filename, content: pdfBase64 }],
    }),
  });

  let payload = null;
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok) {
    return { ok: false, status: response.status, error: payload?.message || `Error de correo ${response.status}` };
  }
  const id = payload?.id || '';
  sentCache.set(cacheKey, id || true);
  return { ok: true, id };
}

export async function GET() {
  return respond({ ok: true, service: 'allzone-claim-email', configured: Boolean(RESEND_KEY), fleet: FLEET_EMAIL });
}

export async function POST(request) {
  if (!RESEND_KEY) return respond({ ok: false, code: 'MAIL_NOT_CONFIGURED', error: 'El servicio de correo no está configurado.' }, 503);

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const requestHost = new URL(request.url).host;
      if (originHost !== requestHost) return respond({ ok: false, error: 'Origen no permitido.' }, 403);
    } catch (_) {
      return respond({ ok: false, error: 'Origen no válido.' }, 403);
    }
  }

  let form;
  try { form = await request.formData(); } catch (_) { return respond({ ok: false, error: 'Solicitud no válida.' }, 400); }

  const pdf = form.get('pdf');
  if (!pdf || typeof pdf.arrayBuffer !== 'function') return respond({ ok: false, error: 'Falta el PDF final.' }, 400);
  if (pdf.type && pdf.type !== 'application/pdf') return respond({ ok: false, error: 'El archivo final debe ser PDF.' }, 400);
  if (Number(pdf.size || 0) <= 0 || Number(pdf.size || 0) > MAX_PDF_BYTES) return respond({ ok: false, error: 'El PDF está vacío o es demasiado grande.' }, 413);

  const counterpart = validEmail(form.get('counterpart_email'));
  if (!counterpart) return respond({ ok: false, error: 'El correo del contrario no es válido.' }, 400);

  const targetRaw = clean(form.get('target'), 20).toLowerCase();
  const target = ['fleet', 'counterpart', 'both'].includes(targetRaw) ? targetRaw : 'both';
  const claimId = cleanId(form.get('claim_id'));
  const filename = clean(form.get('filename'), 120).replace(/[^a-zA-Z0-9._-]/g, '_') || 'PARTE_ALLZONE.pdf';
  const meta = {
    aPlate: clean(form.get('a_plate'), 40),
    bPlate: clean(form.get('b_plate'), 40),
    date: clean(form.get('acc_date'), 30),
    time: clean(form.get('acc_time'), 20),
    place: clean(form.get('acc_place'), 240),
  };

  const pdfBase64 = Buffer.from(await pdf.arrayBuffer()).toString('base64');
  const result = { fleet: null, counterpart: null };

  if (target === 'both' || target === 'fleet') {
    result.fleet = await sendOne({ to: FLEET_EMAIL, claimId, recipientType: 'fleet', pdfBase64, filename, meta });
  }
  if (target === 'both' || target === 'counterpart') {
    result.counterpart = await sendOne({ to: counterpart, claimId, recipientType: 'counterpart', pdfBase64, filename, meta });
  }

  const attempted = [result.fleet, result.counterpart].filter(Boolean);
  const allOk = attempted.length > 0 && attempted.every((item) => item.ok);
  const anyOk = attempted.some((item) => item.ok);
  return respond({ ok: allOk, partial: anyOk && !allOk, fleet_email: FLEET_EMAIL, counterpart_email: counterpart, claim_id: claimId, results: result }, allOk ? 200 : anyOk ? 207 : 502);
}
