export const OPERATIONAL_API_BASE =
  process.env.NEXT_PUBLIC_OPERATIONAL_API_BASE ||
  "https://encumbrate-web-production.up.railway.app";

const localHost = (host) =>
  host === "localhost" || host === "127.0.0.1" || host === "[::1]";

export function operationalApiUrl(path) {
  const value = String(path || "");
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (
    typeof window !== "undefined" &&
    localHost(window.location.hostname)
  )
    return normalized;
  return `${OPERATIONAL_API_BASE.replace(/\/$/, "")}${normalized}`;
}

export async function operationalFetch(path, options = {}, fetcher = fetch) {
  const normalized = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;
  const primary = operationalApiUrl(normalized);
  try {
    const response = await fetcher(primary, {
      ...options,
      credentials: "omit",
    });
    if (![502, 504].includes(response.status)) return response;
  } catch {
    // Railway is the primary operational backend. Vercel remains an emergency fallback.
  }
  return fetcher(normalized, {
    ...options,
    credentials: options.credentials || "same-origin",
  });
}
