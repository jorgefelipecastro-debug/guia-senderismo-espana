import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";
import { recordServerError } from "../../../lib/monitoring";

export const dynamic = "force-dynamic";

const TYPES = {
  alpine_hut: "Refugio de montaña",
  wilderness_hut: "Refugio libre",
  camp_site: "Camping",
  hostel: "Albergue",
  guest_house: "Alojamiento rural",
  chalet: "Casa o cabaña",
  hotel: "Hotel",
};

function cleanWebsite(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const radius = Math.min(50000, Math.max(5000, Number(params.get("radius")) || 25000));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 35 || lat > 44.5 || lon < -10 || lon > 5) {
    return NextResponse.json({ error: "Ubicación no válida en España." }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin().rpc("nearby_accommodations", {
      p_lat: lat,
      p_lon: lon,
      p_radius_m: Math.round(radius),
      p_limit: 250,
    });
    if (error) throw error;
    const items = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      type: row.accommodation_type,
      label: TYPES[row.accommodation_type] || "Alojamiento",
      lat: row.latitude,
      lon: row.longitude,
      distanceKm: Number(row.distance_m) / 1000,
      phone: row.phone || "",
      website: cleanWebsite(row.website),
      openingHours: row.opening_hours || "",
      operator: row.operator_name || "",
      pets: Boolean(row.pets),
      parking: Boolean(row.parking),
      internet: Boolean(row.internet),
      fee: row.fee || "",
      sourceUrl: row.source_url,
    }));
    return NextResponse.json(
      { items, source: "Catálogo Encúmbrate · OpenStreetMap", updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    await recordServerError(error,{route:"/api/accommodations"});
    return NextResponse.json(
      { error: "No se ha podido consultar el catálogo de alojamientos en este momento." },
      { status: 503 },
    );
  }
}
