export function weatherCoordinates(lat, lon) {
  if ([lat, lon].some(v => v === null || v === undefined || String(v).trim() === '')) return null;
  const a = Number(lat), b = Number(lon);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? {lat: +a.toFixed(2), lon: +b.toFixed(2)} : null;
}
export function weatherLabel(code) {
  if (code === 0) return 'Despejado';
  if ([1,2,3].includes(code)) return 'Nuboso';
  if ([45,48].includes(code)) return 'Niebla';
  if ([71,73,75,77,85,86].includes(code)) return 'Nieve';
  if ([95,96,99].includes(code)) return 'Tormenta';
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return 'Lluvia';
  return 'Sin datos';
}
export function validWeatherCache(data) {
  return !!data && Number.isFinite(Date.parse(data.fetchedAt)) && !!data.current && Array.isArray(data.hours) && data.hours.every(h=>h && typeof h.time === 'string') && Array.isArray(data.days) && data.days.length > 0 && data.days.every(d=>d && typeof d.date === 'string');
}
export function daylightHours(sunrise,sunset) {
  if(!sunrise || !sunset)return null;
  const minutes=value=>Number(value.slice(11,13))*60+Number(value.slice(14,16));
  const duration=(minutes(sunset)-minutes(sunrise))/60;
  return Number.isFinite(duration)&&duration>=0?Math.round(duration*10)/10:null;
}
export function weatherAdvice(hours) {
  const warnings = [];
  if (hours.some(h => [95,96,99].includes(h.code))) warnings.push('Posibilidad de tormenta: revisa la salida y evita crestas y zonas expuestas.');
  if (hours.some(h => h.gust >= 40)) warnings.push('Rachas de 40 km/h o más: especial precaución en zonas expuestas.');
  if (hours.some(h => h.rainProbability >= 60 || h.rain >= 1)) warnings.push('Lluvia probable: prepara impermeable y revisa pasos de agua.');
  if (hours.some(h => h.snow > 0 || (Number.isFinite(h.feels) && h.feels <= 0))) warnings.push('Nieve o sensación de frío intenso: revisa equipo y condiciones del terreno.');
  if (hours.some(h => h.feels >= 30)) warnings.push('Calor elevado: prepara agua y evita las horas centrales.');
  if (hours.some(h => h.visibility !== null && h.visibility < 1000)) warnings.push('Visibilidad reducida: lleva el trazado descargado y revisa tus referencias.');
  return warnings;
}
const numeric = v => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function normalizeWeather(data, fetchedAt = new Date().toISOString()) {
  if (!Array.isArray(data?.hourly?.time) || !data.hourly.time.length || !Array.isArray(data?.daily?.time)) throw new Error('Previsión incompleta');
  const h = data.hourly, d = data.daily;
  return {fetchedAt, timezone: data.timezone, elevation: numeric(data.elevation), current: {time: data.current?.time, temperature: numeric(data.current?.temperature_2m), code: numeric(data.current?.weather_code), wind: numeric(data.current?.wind_speed_10m)},
    hours: h.time.map((time,i) => ({time, temperature: numeric(h.temperature_2m?.[i]), feels: numeric(h.apparent_temperature?.[i]), rainProbability: numeric(h.precipitation_probability?.[i]), rain: numeric(h.precipitation?.[i]), snow: numeric(h.snowfall?.[i]), code: numeric(h.weather_code?.[i]), wind: numeric(h.wind_speed_10m?.[i]), gust: numeric(h.wind_gusts_10m?.[i]), windDirection: numeric(h.wind_direction_10m?.[i]), visibility: numeric(h.visibility?.[i]), cloud: numeric(h.cloud_cover?.[i]), uv: numeric(h.uv_index?.[i])})),
    days: d.time.map((date,i) => ({date, min: numeric(d.temperature_2m_min?.[i]), max: numeric(d.temperature_2m_max?.[i]), code: numeric(d.weather_code?.[i]), sunrise: d.sunrise?.[i], sunset: d.sunset?.[i], rainProbability: numeric(d.precipitation_probability_max?.[i])}))};
}
