export async function register() {}

export async function onRequestError(error, request, context) {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.error(JSON.stringify({ level: "error", message: error?.message || "Edge request error", route: request?.path, runtime: context?.runtime }));
    return;
  }
  const { recordServerError } = await import("./lib/monitoring");
  await recordServerError(error, {
    source: "server", severity: "error", route: request?.path,
    method: request?.method, runtime: context?.runtime,
    requestId: request?.headers?.["x-vercel-id"],
  });
}
