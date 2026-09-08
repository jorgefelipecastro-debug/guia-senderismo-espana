import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";

function redact(value, maximum) {
  return String(value || "Error desconocido")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [REDACTADO]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[CORREO]")
    .replace(/([?&](?:token|key|secret|code)=)[^&\s]+/gi, "$1[REDACTADO]")
    .slice(0, maximum);
}

function normalizedMessage(value) {
  return redact(value, 1000)
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "[ID]")
    .replace(/\b\d{4,}\b/g, "[N]");
}

export async function recordServerError(error, context = {}) {
  const message = normalizedMessage(error instanceof Error ? error.message : error);
  const route = redact(context.route || "server", 300);
  const source = ["client", "server", "health"].includes(context.source) ? context.source : "server";
  const severity = ["warning", "error", "critical"].includes(context.severity) ? context.severity : "error";
  const fingerprint = createHash("sha256").update(`${source}|${route}|${message}`).digest("hex");
  const event = { level: severity, message, source, route, fingerprint, requestId: context.requestId || null, release: process.env.VERCEL_GIT_COMMIT_SHA || null };
  console.error(JSON.stringify(event));
  try {
    const supabase = getSupabaseAdmin();
    await supabase.rpc("record_application_error", {
      p_fingerprint: fingerprint, p_source: source, p_severity: severity, p_message: message,
      p_stack: redact(error instanceof Error ? error.stack : "", 8000) || null,
      p_route: route, p_request_id: redact(context.requestId || "", 200) || null,
      p_release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 100) || null,
      p_metadata: { runtime: context.runtime || null, method: context.method || null },
    });
  } catch (monitoringError) {
    console.warn("Monitoring persistence unavailable", monitoringError instanceof Error ? monitoringError.message : "unknown");
  }
  return fingerprint;
}
