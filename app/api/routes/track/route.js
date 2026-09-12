import { NextResponse } from "next/server";
import { simplifyTrack } from "../../../../lib/navigation-geometry";
import { flattenSegments, resolveRouteGeometry, routeDistanceKm } from "../../../../lib/route-geometry";

export const dynamic = "force-dynamic";

function sample(points, max = 2000) {
  return simplifyTrack(points, max);
}

export async function GET(request) {
  const raw = request.nextUrl.searchParams.get("id") || "";
  if (!/^[a-z0-9-]+$/i.test(raw))
    return NextResponse.json(
      { error: "Referencia de ruta no válida." },
      { status: 400 },
    );
  try {
    const geometry = await resolveRouteGeometry(raw);
    if (!geometry?.segments?.length)
      return NextResponse.json(
        { error: "Esta fuente oficial no publica todavía un trazado navegable." },
        { status: 503 },
      );
    const points = flattenSegments(geometry.segments);
    if (points.length < 2)
      return NextResponse.json(
        { error: "El trazado público de esta ruta no está disponible ahora." },
        { status: 503 },
      );
    return NextResponse.json(
      {
        points: sample(points),
        distanceKm: routeDistanceKm(geometry.segments),
        source: geometry.source,
        official: geometry.official,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "El trazado público de esta ruta no está disponible ahora." },
      { status: 503 },
    );
  }
}
