const POLICIES = [
  { match: (path) => path === "/api/account/delete", scope: "account-delete", limit: 3, windowSeconds: 3600, failClosed: true },
  { match: (path) => path === "/api/allzone/send-claim", scope: "allzone-claim-email", limit: 6, windowSeconds: 3600, failClosed: true },
  { match: (path) => path.startsWith("/api/admin/") || path === "/api/process-accreditation-emails", scope: "administration", limit: 10, windowSeconds: 60, failClosed: true },
  { match: (path) => path === "/api/navigation/return", scope: "navigation-return", limit: 20, windowSeconds: 300, failClosed: false },
  { match: (path) => ["/api/routes/access", "/api/routes/image", "/api/routes/profile", "/api/routes/trace", "/api/routes/track"].includes(path), scope: "enriched-route", limit: 30, windowSeconds: 60, failClosed: false },
];

export function rateLimitPolicy(pathname, method = "GET") {
  const exact = POLICIES.find(({ match }) => match(pathname));
  if (exact) return exact;
  if (!["GET", "HEAD", "OPTIONS"].includes(String(method).toUpperCase())) {
    return { scope: "api-write", limit: 30, windowSeconds: 60, failClosed: true };
  }
  return { scope: "api-read", limit: 120, windowSeconds: 60, failClosed: false };
}

export function clientAddress(headers) {
  return String(
    headers.get("x-vercel-forwarded-for") ||
    headers.get("x-forwarded-for") ||
    headers.get("x-real-ip") ||
    "unknown",
  ).split(",")[0].trim().slice(0, 80);
}
