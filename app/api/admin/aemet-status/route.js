import { getSupabaseAdmin } from '../../../../lib/supabase-admin.js';
import { aemetCredentialHealth } from '../../../../lib/aemet-key-maintenance.js';

export const dynamic = 'force-dynamic';

async function adminFor(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || data.user?.app_metadata?.role !== 'admin') return null;
  return { supabase, user: data.user };
}

export async function GET(request) {
  const auth = await adminFor(request);
  if (!auth) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  const status = await aemetCredentialHealth();
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
