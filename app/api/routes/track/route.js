import { NextResponse } from "next/server";
import { operationalOptions, withOperationalCors } from "../../../../lib/operational-cors.js";
import { flattenSegments, resolveRouteGeometry, routeDistanceKm } from "../../../../lib/route-geometry";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const raw = request.nextUrl.searchParams.get("id") || "";
  if (!/^[a-z0-9-]+$/i.test(raw))
    return withOperationalCors(request, NextResponse.json(
      { error: "Referencia de ruta no válida." },
      { status: 400 },
    ), "GET, OPTIONS");
  try {
    const geometry = await resolveRouteGeometry(raw);
    if (!geometry?.segments?.length)
      return withOperationalCors(request, NextResponse.json(
        { error: "Esta ruta no dispone de un trazado GPS verificado." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      ), "GET, OPTIONS");
    const points = flattenSegments(geometry.segments);
    if (points.length < 2)
      return withOperationalCors(request, NextResponse.json(
        { error: "El trazado público de esta ruta no está disponible ahora." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      ), "GET, OPTIONS");
    return withOperationalCors(request, NextResponse.json(
      {
        points,
        segments: geometry.segments,
        distanceKm: routeDistanceKm(geometry.segments),
        source: geometry.source,
        official: geometry.official,
        geometryVersion: "continuous-v3",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    ), "GET, OPTIONS");
  } catch {
    return withOperationalCors(request, NextResponse.json(
      { error: "El trazado público de esta ruta no está disponible ahora." },
      { status: 503 },
    ), "GET, OPTIONS");
  }
}

export async function OPTIONS(request) {
  return operationalOptions(request, "GET, OPTIONS");
}
