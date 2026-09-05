import { NextResponse } from "next/server";
import { validateReturnRoute } from "../../../../lib/navigation-geometry";

export const dynamic = "force-dynamic";
const coordinate = (value) => Number.isFinite(value) && Math.abs(value) <= 180;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud no válida." },
      { status: 400 },
    );
  }
  const from = { lat: Number(body?.from?.lat), lon: Number(body?.from?.lon) },
    to = { lat: Number(body?.to?.lat), lon: Number(body?.to?.lon) };
  if (
    !coordinate(from.lat) ||
    !coordinate(from.lon) ||
    !coordinate(to.lat) ||
    !coordinate(to.lon) ||
    Math.abs(from.lat) > 90 ||
    Math.abs(to.lat) > 90
  )
    return NextResponse.json(
      { error: "Coordenadas no válidas." },
      { status: 400 },
    );
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token)
    return NextResponse.json(
      { error: "El retorno Mapbox no está configurado." },
      { status: 503 },
    );
  try {
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${from.lon},${from.lat};${to.lon},${to.lat}`,
    );
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "true");
    url.searchParams.set("alternatives", "false");
    url.searchParams.set("exclude", "ferry");
    url.searchParams.set("radiuses", "50;50");
    url.searchParams.set("walkway_bias", "1");
    url.searchParams.set("access_token", token);
    const response = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      }),
      data = await response.json(),
      coordinates = data?.routes?.[0]?.geometry?.coordinates;
    if (!response.ok || !Array.isArray(coordinates) || coordinates.length < 2)
      throw new Error();
    const points = coordinates.map(([lon, lat]) => ({ lat, lon })),
      distanceM = Math.round(data.routes[0].distance),
      validation = validateReturnRoute({ from, to, points, distanceM });
    if (!validation.safe)
      return NextResponse.json({ error: validation.reason }, { status: 422 });
    return NextResponse.json({
      points,
      distanceM,
      provider: "Mapbox Walking",
      verified: false,
      warning:
        "Ruta orientativa calculada sobre caminos cartografiados. Comprueba el terreno antes de avanzar.",
    });
  } catch {
    return NextResponse.json(
      { error: "No hay ahora una ruta peatonal fiable hasta el sendero." },
      { status: 503 },
    );
  }
}
