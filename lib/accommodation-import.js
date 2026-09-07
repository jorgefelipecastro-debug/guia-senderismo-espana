const OVERPASS_ENDPOINTS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
const TYPES = new Set(["alpine_hut", "wilderness_hut", "camp_site", "hostel", "guest_house", "chalet", "hotel"]);

const short = (value, limit) => String(value || "").trim().slice(0, limit) || null;
const yes = value => ["yes", "permissive", "designated", "wlan", "wifi"].includes(String(value || "").toLowerCase());

function website(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeAccommodation(element, seenAt = new Date().toISOString()) {
  const tags = element.tags || {};
  const type = tags.tourism;
  const latitude = Number(element.lat ?? element.center?.lat);
  const longitude = Number(element.lon ?? element.center?.lon);
  if (!TYPES.has(type) || !tags.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < 35 || latitude > 44.5 || longitude < -10 || longitude > 5) return null;
  return {
    id: `osm-${element.type}-${element.id}`,
    source: "openstreetmap",
    source_type: element.type,
    external_id: Number(element.id),
    name: short(tags.name, 180),
    accommodation_type: type,
    latitude,
    longitude,
    location: `POINT(${longitude} ${latitude})`,
    operator_name: short(tags.operator, 120),
    phone: short(tags["contact:phone"] || tags.phone, 80),
    website: website(tags["contact:website"] || tags.website || tags.url),
    opening_hours: short(tags.opening_hours, 160),
    pets: yes(tags.dog),
    parking: yes(tags.parking) || Boolean(tags["parking:condition"]),
    internet: yes(tags.internet_access),
    fee: short(tags.fee, 30),
    source_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    raw_tags: tags,
    active: true,
    last_seen_at: seenAt,
    updated_at: seenAt,
  };
}

export async function fetchRegionAccommodations(areaId) {
  const query = `[out:json][timeout:90];area(${areaId})->.searchArea;nwr["tourism"~"^(alpine_hut|wilderness_hut|camp_site|hostel|guest_house|chalet|hotel)$"](area.searchArea);out center tags;`;
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": "Encumbrate-importer/1.0 (https://www.encumbrate.es)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(110000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No accommodation source available");
}
