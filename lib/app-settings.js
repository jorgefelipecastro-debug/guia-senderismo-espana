export const SETTINGS_KEY = 'encumbrate:settings:v1';
export const DEFAULT_SETTINGS = { level: 'todas', maxDistance: 0, largeText: false, reducedMotion: false };
export function normalizeSettings(value = {}) {
  return {
    level: ['todas','principiante','intermedio','experto'].includes(value?.level) ? value.level : 'todas',
    maxDistance: [0,5,10,15,20,30].includes(value?.maxDistance) ? value.maxDistance : 0,
    largeText: value?.largeText === true,
    reducedMotion: value?.reducedMotion === true,
  };
}
export function readSettings() {
  try { return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY))); }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export function applySettings(settings) {
  document.documentElement.classList.toggle('encLargeText', settings.largeText);
  document.documentElement.classList.toggle('encReducedMotion', settings.reducedMotion);
}
