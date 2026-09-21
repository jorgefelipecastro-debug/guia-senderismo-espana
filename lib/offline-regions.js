export const SPAIN_OFFLINE_BOUNDS = [-18.3, 27.5, 4.5, 43.9];

export const SPAIN_TERRITORIES = {
  'Andalucía': ['Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla'],
  'Aragón': ['Huesca','Teruel','Zaragoza'],
  'Principado de Asturias': ['Asturias'],
  'Illes Balears': ['Illes Balears'],
  'Canarias': ['Las Palmas','Santa Cruz de Tenerife'],
  'Cantabria': ['Cantabria'],
  'Castilla-La Mancha': ['Albacete','Ciudad Real','Cuenca','Guadalajara','Toledo'],
  'Castilla y León': ['Ávila','Burgos','León','Palencia','Salamanca','Segovia','Soria','Valladolid','Zamora'],
  'Cataluña': ['Barcelona','Girona','Lleida','Tarragona'],
  'Comunidad Valenciana': ['Alicante','Castellón','Valencia'],
  'Extremadura': ['Badajoz','Cáceres'],
  'Galicia': ['A Coruña','Lugo','Ourense','Pontevedra'],
  'La Rioja': ['La Rioja'],
  'Comunidad de Madrid': ['Madrid'],
  'Región de Murcia': ['Murcia'],
  'Comunidad Foral de Navarra': ['Navarra'],
  'País Vasco': ['Álava','Bizkaia','Gipuzkoa'],
  'Ceuta': ['Ceuta'],
  'Melilla': ['Melilla'],
};

export const OFFLINE_MAP_PROFILES = {
  country: { minZoom: 5, maxZoom: 9, label: 'Mapa base nacional' },
  community: { minZoom: 7, maxZoom: 13, label: 'Detalle de comunidad' },
  province: { minZoom: 8, maxZoom: 14, label: 'Detalle de provincia' },
  route: { minZoom: 10, maxZoom: 15, label: 'Detalle de ruta' },
};

export const OFFLINE_MAP_TILE_SIZE = 512;
export const OFFLINE_MAP_SOURCE = '© Instituto Geográfico Nacional · CC BY 4.0';

export function normalizeOfflineRegionName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

export function isKnownOfflineRegion(kind, name) {
  if (kind === 'country') return normalizeOfflineRegionName(name) === 'espana';
  if (kind === 'community') return Object.keys(SPAIN_TERRITORIES).some(item => normalizeOfflineRegionName(item) === normalizeOfflineRegionName(name));
  if (kind === 'province') return Object.values(SPAIN_TERRITORIES).flat().some(item => normalizeOfflineRegionName(item) === normalizeOfflineRegionName(name));
  return false;
}

export function offlineRegionId(kind, name) {
  const slug = normalizeOfflineRegionName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${kind}:${slug}`;
}

export function offlineRegionProfile(kind) {
  return OFFLINE_MAP_PROFILES[kind] || OFFLINE_MAP_PROFILES.province;
}
