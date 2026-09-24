const DAY_MS = 24 * 60 * 60 * 1000;

export function catalogFreshness(value, now = Date.now()) {
  const seen = Date.parse(value || '');
  const current = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(seen) || !Number.isFinite(current) || seen > current + 5 * 60 * 1000) return null;
  return {
    date: new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
    }).format(new Date(seen)),
    olderThan30Days: current - seen > 30 * DAY_MS,
  };
}
