import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimitPolicy, clientAddress } from "./lib/api-rate-limit";
import { getSupabaseAdmin } from "./lib/supabase-admin";

const localBuckets = globalThis.__allzoneLocalRateBuckets || new Map();
globalThis.__allzoneLocalRateBuckets = localBuckets;

function fingerprint(value) {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Rate-limit secret is not configured");
  return createHmac("sha256", secret).update(String(value)).digest("hex");
}

function bearerToken(request) {
  const match = String(request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function limitedResponse(result) {
  const retryAfter = Math.max(1, Number(result.retry_after_seconds) || 1);
  return NextResponse.json(
    { error: "Has realizado demasiadas solicitudes. Espera un momento antes de volver a intentarlo." },
    {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": String(result.limit_value),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(retryAfter),
      },
    },
  );
}

function localFallbackRateLimit(request, policy) {
  const now = Date.now();
  const windowMs = Math.max(1, Number(policy.windowSeconds) || 60) * 1000;
  const ip = clientAddress(request.headers);
  const key = createHash("sha256").update(`${policy.scope}:${ip}`).digest("hex");
  let bucket = localBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + windowMs };
  if (bucket.count >= policy.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return limitedResponse({
      retry_after_seconds: retryAfter,
      limit_value: policy.limit,
    });
  }
  bucket.count += 1;
  localBuckets.set(key, bucket);

  if (localBuckets.size > 2000) {
    for (const [bucketKey, value] of localBuckets) {
      if (now >= value.resetAt) localBuckets.delete(bucketKey);
    }
  }

  return NextResponse.next();
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const policy = rateLimitPolicy(pathname, request.method);

  try {
    const admin = getSupabaseAdmin();
    let userHash = null;
    const token = bearerToken(request);
    if (token) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data?.user?.id) userHash = fingerprint(`user:${data.user.id}`);
    }

    const { data, error } = await admin.rpc("enforce_api_rate_limit", {
      p_scope: policy.scope,
      p_ip_hash: fingerprint(`ip:${clientAddress(request.headers)}`),
      p_user_hash: userHash,
      p_ip_limit: userHash ? policy.limit * 5 : policy.limit,
      p_user_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.allowed) return limitedResponse(result || {});
    return NextResponse.next();
  } catch (error) {
    console.error("API rate limiter unavailable", error);

    // The accident form is intentionally usable from a public QR. In preview
    // environments Supabase may not be configured, so keep a best-effort
    // per-instance limit instead of blocking the actual email endpoint.
    if (pathname === "/api/allzone/send-claim") {
      return localFallbackRateLimit(request, policy);
    }

    if (policy.failClosed) {
      return NextResponse.json(
        { error: "El control de seguridad no está disponible. Inténtalo de nuevo en unos segundos." },
        { status: 503, headers: { "Cache-Control": "private, no-store", "Retry-After": "10" } },
      );
    }
    return NextResponse.next();
  }
}

export const config = { matcher: "/api/:path*" };
