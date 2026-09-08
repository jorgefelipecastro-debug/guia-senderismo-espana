export const MATERIAL_STORAGE_KEY = "encumbrate:material:v1";

export const BASE_MATERIAL = [
  { id: "water", name: "Agua", detail: "Cantidad ajustada a la duración y al calor", category: "Hidratación", essential: true },
  { id: "food", name: "Comida y algo energético", detail: "Incluye una reserva para un retraso", category: "Alimentación", essential: true },
  { id: "phone", name: "Móvil cargado", detail: "Con Encúmbrate y el teléfono de emergencia disponible", category: "Orientación", essential: true },
  { id: "offline", name: "Ruta y mapa offline", detail: "Descárgalos antes de perder cobertura", category: "Orientación", essential: true },
  { id: "first-aid", name: "Botiquín básico", detail: "Material revisado y dentro de fecha", category: "Seguridad", essential: true },
  { id: "whistle", name: "Silbato y manta térmica", detail: "Accesibles, no al fondo de la mochila", category: "Seguridad", essential: true },
  { id: "sun", name: "Protección solar", detail: "Crema, gafas y gorra", category: "Protección", essential: true },
  { id: "layer", name: "Capa de abrigo", detail: "La temperatura puede caer con la altitud", category: "Ropa", essential: true },
];

const OPTIONAL_MATERIAL = {
  long: { id: "power", name: "Batería externa", detail: "Para rutas largas o uso continuo del GPS", category: "Orientación" },
  hard: { id: "poles", name: "Bastones", detail: "Útiles con desnivel o terreno irregular", category: "Accesorios" },
  rain: { id: "rain", name: "Chaqueta impermeable", detail: "Protege también la mochila", category: "Ropa" },
  cold: { id: "cold", name: "Guantes, gorro y capa térmica", detail: "Evita algodón como primera capa", category: "Ropa" },
  night: { id: "headlamp", name: "Frontal con batería de repuesto", detail: "Obligatorio si puedes terminar sin luz", category: "Seguridad" },
  heat: { id: "extra-water", name: "Agua adicional y sales", detail: "Planifica puntos de sombra y retorno", category: "Hidratación" },
  pet: { id: "pet-kit", name: "Equipo para la mascota", detail: "Agua, bebedero, correa, identificación y protector de almohadillas", category: "Mascotas" },
};

function durationHours(route) {
  if (Number.isFinite(route?.durationSeconds)) return route.durationSeconds / 3600;
  const match = String(route?.duration || "").match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);
  return match ? Number(match[1] || 0) + Number(match[2] || 0) / 60 : 0;
}

export function buildMaterialList(route = null, conditions = {}) {
  const distance = Number(route?.distanceKm || 0), ascent = Number(route?.ascentM || 0), altitude = Number(route?.maxAltitudeM || 0), hours = durationHours(route);
  const keys = [];
  if (distance >= 10 || hours >= 3) keys.push("long");
  if (ascent >= 450 || route?.level === "experto" || route?.level === "intermedio") keys.push("hard");
  if (conditions.rain) keys.push("rain");
  if (conditions.cold || altitude >= 1800) keys.push("cold");
  if (conditions.night) keys.push("night");
  if (conditions.heat) keys.push("heat");
  if (conditions.pet) keys.push("pet");
  return [...BASE_MATERIAL, ...keys.map(key => OPTIONAL_MATERIAL[key])];
}

export function preparationSummary(list, packed = {}) {
  const prepared = list.filter(item => packed[item.id] === "packed").length;
  const missingEssential = list.filter(item => item.essential && packed[item.id] !== "packed").length;
  return { prepared, total: list.length, missingEssential, percent: list.length ? Math.round(prepared * 100 / list.length) : 0 };
}

export const SHOP_CATALOG = [
  { id: "boots", icon: "🥾", name: "Calzado de senderismo", category: "Ropa", reason: "Agarre, ajuste y protección adecuados al terreno", status: "compare" },
  { id: "jacket", icon: "◩", name: "Chaqueta impermeable", category: "Ropa", reason: "Protección ligera frente a lluvia y viento", status: "compare" },
  { id: "backpack", icon: "🎒", name: "Mochilas", category: "Accesorios", reason: "Capacidad y ajuste según la duración de la ruta", status: "compare" },
  { id: "poles", icon: "╱", name: "Bastones", category: "Accesorios", reason: "Apoyo en desniveles y terreno irregular", status: "compare" },
  { id: "headlamp", icon: "☀", name: "Frontales", category: "Seguridad", reason: "Iluminación fiable y batería de reserva", status: "review-required" },
  { id: "pet", icon: "🐾", name: "Material para mascotas", category: "Mascotas", reason: "Arnés, bebedero y protección de almohadillas", status: "compare" },
];

export const COMMERCE_READINESS = Object.freeze({
  mode: "recommendations",
  checkoutEnabled: false,
  affiliateLinksEnabled: false,
  sellerOfRecord: false,
  requiredBeforeSale: ["supplier_verified", "sample_tested", "eu_responsible_person", "traceability", "returns_ready"],
});
