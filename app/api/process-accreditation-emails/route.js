const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

const respond = (body, status = 200) => Response.json(body, { status });

async function supabase(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
}

export async function GET(request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!expected || authorization !== `Bearer ${expected}`) {
    return respond({ ok: false, error: 'Unauthorized' }, 401);
  }
  if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
    return respond({ ok: false, error: 'Server configuration incomplete' }, 503);
  }

  const queueResponse = await supabase(
    '/rest/v1/accreditation_email_outbox?status=eq.queued&select=id,request_id,user_id,subject,body_html,attempts&order=created_at.asc&limit=10'
  );
  if (!queueResponse.ok) return respond({ ok: false, error: 'Queue unavailable' }, 502);

  const queued = await queueResponse.json();
  const results = [];

  for (const item of queued) {
    const claim = await supabase(
      `/rest/v1/accreditation_email_outbox?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'sending', attempts: Number(item.attempts || 0) + 1 })
      }
    );
    const claimed = claim.ok ? await claim.json() : [];
    if (!claimed.length) continue;

    try {
      const userResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(item.user_id)}`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, cache: 'no-store' }
      );
      if (!userResponse.ok) throw new Error('Recipient lookup failed');
      const recipient = await userResponse.json();
      if (!recipient.email) throw new Error('Recipient email missing');

      const sendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `accreditation-${item.request_id}`
        },
        body: JSON.stringify({
          from: 'Encúmbrate <noreply@encumbrate.es>',
          to: [recipient.email],
          subject: item.subject,
          html: item.body_html
        })
      });
      if (!sendResponse.ok) throw new Error(`Resend error ${sendResponse.status}`);

      const sentAt = new Date().toISOString();
      await supabase(`/rest/v1/accreditation_email_outbox?id=eq.${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent', sent_at: sentAt, last_error: null })
      });
      await supabase(`/rest/v1/experience_accreditation_requests?id=eq.${encodeURIComponent(item.request_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ email_delivery_status: 'sent', email_sent_at: sentAt })
      });
      results.push({ id: item.id, status: 'sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      await supabase(`/rest/v1/accreditation_email_outbox?id=eq.${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'failed', last_error: message })
      });
      await supabase(`/rest/v1/experience_accreditation_requests?id=eq.${encodeURIComponent(item.request_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ email_delivery_status: 'failed' })
      });
      results.push({ id: item.id, status: 'failed' });
    }
  }

  return respond({ ok: true, processed: results.length, results });
}
