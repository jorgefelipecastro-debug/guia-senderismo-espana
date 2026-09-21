const FIXED_ORIGINS = new Set([
  "https://encumbrate.es",
  "https://www.encumbrate.es",
  "https://encumbrate-web-production.up.railway.app",
]);

function allowedOrigin(request) {
  const origin = request?.headers?.get?.("origin") || "";
  if (!origin) return "";
  if (FIXED_ORIGINS.has(origin)) return origin;
  if (
    /^https:\/\/guia-senderismo-espana(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
      origin,
    )
  )
    return origin;
  if (/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin))
    return origin;
  return "";
}

export function operationalCorsHeaders(
  request,
  methods = "GET, POST, OPTIONS",
) {
  const headers = new Headers();
  const origin = allowedOrigin(request);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function withOperationalCors(request, response, methods) {
  const headers = operationalCorsHeaders(request, methods);
  for (const [name, value] of headers) response.headers.set(name, value);
  response.headers.set("X-Encumbrate-Backend", "operational");
  return response;
}

export function operationalOptions(request, methods) {
  return new Response(null, {
    status: 204,
    headers: operationalCorsHeaders(request, methods),
  });
}
