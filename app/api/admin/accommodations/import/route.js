import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase-admin";
import { fetchRegionAccommodations, normalizeAccommodation } from "../../../../../lib/accommodation-import";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function equalSecret(provided, expected) {
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(String(expected || ""));
  return Boolean(right.length) && left.length === right.length && timingSafeEqual(left, right);
}

async function authorize(request, supabase) {
  if (process.env.CRON_SECRET && equalSecret(request.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) return true;
  const { data, error } = await supabase.from("route_import_control").select("import_key,enabled").eq("id", true).single();
  return !error && data?.enabled && equalSecret(request.headers.get("x-encumbrate-import-key"), data.import_key);
}

async function upsertBatches(supabase, rows) {
  for (let offset = 0; offset < rows.length; offset += 300) {
    const { error } = await supabase.from("accommodations").upsert(rows.slice(offset, offset + 300), {
      onConflict: "source,source_type,external_id",
    });
    if (error) throw error;
  }
}

async function importOne(supabase) {
  const { data: claimed, error: claimError } = await supabase.rpc("claim_next_accommodation_import_region");
  if (claimError) throw claimError;
  const region = claimed?.[0];
  if (!region) return null;
  const seenAt = new Date().toISOString();
  try {
    const payload = await fetchRegionAccommodations(region.osm_area_id);
    const rows = (payload.elements || []).map(item => normalizeAccommodation(item, seenAt)).filter(Boolean);
    await upsertBatches(supabase, rows);
    const { error } = await supabase.from("accommodation_import_regions").update({
      status: "ready", accommodation_count: rows.length, last_completed_at: new Date().toISOString(),
      last_error: null, updated_at: new Date().toISOString(),
    }).eq("region_code", region.region_code);
    if (error) throw error;
    return { region: region.province, imported: rows.length };
  } catch (error) {
    const message = String(error?.message || "Error de importación").slice(0, 500);
    await supabase.from("accommodation_import_regions").update({
      status: "error", last_error: message, updated_at: new Date().toISOString(),
    }).eq("region_code", region.region_code);
    throw new Error(`${region.province}: ${message}`);
  }
}

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!(await authorize(request, supabase))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const requested = Number(request.nextUrl.searchParams.get("batch")) || 1;
  const batch = Math.min(3, Math.max(1, requested));
  const imported = [];
  try {
    for (let index = 0; index < batch; index += 1) {
      const result = await importOne(supabase);
      if (!result) break;
      imported.push(result);
    }
    return NextResponse.json({ done: imported.length < batch, imported });
  } catch (error) {
    console.error("Accommodation import failed", error);
    return NextResponse.json({ error: error.message, imported }, { status: 502 });
  }
}

export const POST = GET;
