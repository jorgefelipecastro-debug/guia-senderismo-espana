export function suspiciousRouteImport(previousCount, newCount) {
  const previous = Number(previousCount);
  const incoming = Number(newCount);
  if (!Number.isFinite(previous) || previous <= 0) return false;
  if (!Number.isFinite(incoming) || incoming < 0) return true;
  return incoming === 0 || (previous >= 10 && incoming < previous / 2);
}
