"use client";

import { useEffect, useRef, useState } from "react";
import { breadcrumbReturn } from "../lib/navigation-geometry";

function OfflineFallback({ track, position, target, safeReturn }) {
  const points = [...track.points, ...safeReturn, position, target],
    lat0 = points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    scale = Math.max(0.2, Math.cos((lat0 * Math.PI) / 180)),
    project = (p) => ({ x: p.lon * scale, y: -p.lat }),
    raw = points.map(project),
    minX = Math.min(...raw.map((p) => p.x)),
    maxX = Math.max(...raw.map((p) => p.x)),
    minY = Math.min(...raw.map((p) => p.y)),
    maxY = Math.max(...raw.map((p) => p.y)),
    factor = Math.min(
      320 / Math.max(0.00001, maxX - minX),
      220 / Math.max(0.00001, maxY - minY),
    ),
    canvas = (p) => {
      const q = project(p);
      return {
        x: 180 + (q.x - (minX + maxX) / 2) * factor,
        y: 130 + (q.y - (minY + maxY) / 2) * factor,
      };
    },
    path = track.points
      .map((p, index) => {
        const q = canvas(p);
        return `${index ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`;
      })
      .join(" "),
    returnPath = safeReturn
      .map((p, index) => {
        const q = canvas(p);
        return `${index ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`;
      })
      .join(" "),
    user = canvas(position),
    goal = canvas(target);
  return (
    <div className="recoveryCartography">
      <svg
        className="offlineRouteMap"
        viewBox="0 0 360 260"
        role="img"
        aria-label="Trazado offline, pasos registrados y posición GPS"
      >
        <rect width="360" height="260" rx="18" />
        <path
          className="offlineTerrain"
          d="M-20 65 Q85 5 185 67 T390 55 M-20 142 Q80 80 190 145 T390 130 M-20 220 Q90 158 195 218 T390 205"
        />
        <path className="offlineTrailShadow" d={path} />
        <path className="offlineTrail" d={path} />
        {returnPath && <path className="offlineReturn" d={returnPath} />}
        <circle className="offlineTarget" cx={goal.x} cy={goal.y} r="8" />
        <circle className="offlineUserHalo" cx={user.x} cy={user.y} r="14" />
        <circle className="offlineUser" cx={user.x} cy={user.y} r="7" />
      </svg>
      <div className="recoveryOffline">
        Modo completamente offline · trazado y GPS disponibles
      </div>
      <div className="recoveryRoutingStatus">
        {safeReturn.length > 1
          ? "Línea roja: vuelve sobre tus propios pasos"
          : "No hay suficientes pasos registrados: detente y comprueba el terreno"}
      </div>
    </div>
  );
}

export default function RecoveryRouteMap({
  track,
  position,
  target,
  bearing,
  breadcrumbs = [],
}) {
  const safeReturn = breadcrumbReturn(position, breadcrumbs, track.points),
    nodeRef = useRef(null),
    mapRef = useRef(null),
    userRef = useRef(null),
    returnRef = useRef(null),
    stepsRef = useRef(null),
    [online, setOnline] = useState(
      () => typeof navigator === "undefined" || navigator.onLine,
    ),
    [tileError, setTileError] = useState(false),
    [routing, setRouting] = useState(
      safeReturn.length > 1
        ? "Prioridad: vuelve sobre tus pasos registrados"
        : "Calculando alternativa orientativa…",
    );
  useEffect(() => {
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    window.addEventListener("online", yes);
    window.addEventListener("offline", no);
    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);
  useEffect(() => {
    if (!online) return;
    let active = true;
    async function mount() {
      const L = (await import("leaflet")).default;
      if (!active || !nodeRef.current) return;
      const route = track.points.map((point) => [point.lat, point.lon]),
        map = L.map(nodeRef.current, {
          zoomControl: false,
          attributionControl: true,
        });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      })
        .on("tileerror", () => setTileError(true))
        .addTo(map);
      L.polyline(route, { color: "#053e2c", weight: 11, opacity: 0.72 }).addTo(
        map,
      );
      L.polyline(route, { color: "#73d342", weight: 6 }).addTo(map);
      if (safeReturn.length > 1)
        stepsRef.current = L.polyline(
          safeReturn.map((point) => [point.lat, point.lon]),
          { color: "#dc342d", weight: 7 },
        ).addTo(map);
      L.circleMarker([target.lat, target.lon], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#ef302b",
        fillOpacity: 1,
      }).addTo(map);
      const icon = L.divIcon({
        className: "hikerArrowIcon recoveryArrow",
        html: `<span style="transform:rotate(${bearing}deg)">▲</span>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      userRef.current = L.marker([position.lat, position.lon], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
      map.fitBounds(
        L.latLngBounds([
          ...route,
          [position.lat, position.lon],
          [target.lat, target.lon],
        ]),
        { padding: [45, 45] },
      );
      L.control.zoom({ position: "bottomright" }).addTo(map);
    }
    mount();
    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
      stepsRef.current = null;
    };
  }, [track.id, online]);
  useEffect(() => {
    if (!online || !mapRef.current) return;
    import("leaflet").then((module) => {
      const L = module.default,
        map = mapRef.current;
      if (!map) return;
      stepsRef.current?.remove();
      stepsRef.current =
        safeReturn.length > 1
          ? L.polyline(
              safeReturn.map((point) => [point.lat, point.lon]),
              { color: "#dc342d", weight: 7 },
            ).addTo(map)
          : null;
    });
  }, [position.lat, position.lon, breadcrumbs.length, online]);
  useEffect(() => {
    if (!online) return;
    const map = mapRef.current;
    if (!map || !userRef.current) return;
    import("leaflet").then((module) => {
      const L = module.default,
        icon = L.divIcon({
          className: "hikerArrowIcon recoveryArrow",
          html: `<span style="transform:rotate(${bearing}deg)">▲</span>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
      userRef.current.setLatLng([position.lat, position.lon]).setIcon(icon);
      map.panTo([position.lat, position.lon], { animate: true });
    });
  }, [position.lat, position.lon, bearing, online]);
  useEffect(() => {
    if (!online) return;
    const controller = new AbortController(),
      timer = setTimeout(async () => {
        try {
          const response = await fetch("/api/navigation/return", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ from: position, to: target }),
              signal: controller.signal,
            }),
            body = await response.json();
          if (!response.ok || !Array.isArray(body.points))
            throw new Error(body.error);
          const L = (await import("leaflet")).default,
            map = mapRef.current;
          if (!map) return;
          returnRef.current?.remove();
          returnRef.current = L.polyline(
            body.points.map((point) => [point.lat, point.lon]),
            { color: "#e3a323", weight: 5, dashArray: "10 8" },
          ).addTo(map);
          setRouting(
            safeReturn.length > 1
              ? `Rojo: tus pasos · ámbar: alternativa orientativa de ${Math.round(body.distanceM)} m`
              : `Alternativa orientativa de ${Math.round(body.distanceM)} m · comprueba el terreno`,
          );
        } catch (error) {
          if (!controller.signal.aborted) {
            returnRef.current?.remove();
            returnRef.current = null;
            setRouting(
              safeReturn.length > 1
                ? "Usa la línea roja de tus pasos; no hay alternativa online válida"
                : error instanceof Error
                  ? error.message
                  : "No se ha encontrado una alternativa cartografiada.",
            );
          }
        }
      }, 1200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position.lat, position.lon, target.lat, target.lon, online]);
  if (!online)
    return (
      <OfflineFallback
        track={track}
        position={position}
        target={target}
        safeReturn={safeReturn}
      />
    );
  return (
    <div className="recoveryCartography">
      <div ref={nodeRef} className="recoveryMapCanvas" />
      {tileError && (
        <div className="recoveryOffline">
          Sin fondo cartográfico · GPS y sendero siguen visibles
        </div>
      )}
      <div className="recoveryLegend">
        <span>
          <i className="legendGreen" />
          Sendero
        </span>
        {safeReturn.length > 1 && (
          <span>
            <i className="legendRed" />
            Tus pasos
          </span>
        )}
        <span>
          <i className="legendAmber" />
          Alternativa
        </span>
        <span>
          <i className="legendBlue" />
          Tu posición
        </span>
      </div>
      <div className="recoveryRoutingStatus">{routing}</div>
    </div>
  );
}
