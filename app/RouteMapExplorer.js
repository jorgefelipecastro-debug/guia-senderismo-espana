"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./route-map-explorer.css";

const FALLBACK = { lat: 38.3452, lon: -0.4815 };
const COLORS = { principiante: "#16884d", intermedio: "#1478c8", experto: "#7545bd" };
const LABELS = { principiante: "Principiante", intermedio: "Intermedio", experto: "Experto" };
const offlineKey = (id) => `encumbrate:offline-route:${id}`;

function isDownloaded(id) {
  try { return Boolean(localStorage.getItem(offlineKey(id))); } catch { return false; }
}

export default function RouteMapExplorer({ initialRoutes, completed, close, select }) {
  const nodeRef = useRef(null), mapRef = useRef(null), markersRef = useRef(null), userRef = useRef(null), centerRef = useRef(FALLBACK);
  const [routes, setRoutes] = useState(initialRoutes), [level, setLevel] = useState("todas"), [maxDistance, setMaxDistance] = useState("todas"), [circular, setCircular] = useState(false), [preview, setPreview] = useState(null), [moved, setMoved] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(""), [mapReady, setMapReady] = useState(false);
  const visible = useMemo(() => routes.filter(route => (level === "todas" || route.level === level) && (maxDistance === "todas" || Number(route.distanceKm) <= Number(maxDistance)) && (!circular || String(route.routeType).toLocaleLowerCase("es").includes("circular"))), [routes, level, maxDistance, circular]);

  useEffect(() => {
    let active = true;
    async function mount() {
      const L = (await import("leaflet")).default;
      if (!active || !nodeRef.current) return;
      const start = initialRoutes[0] ? { lat: initialRoutes[0].lat, lon: initialRoutes[0].lon } : FALLBACK;
      centerRef.current = start;
      const map = L.map(nodeRef.current, { zoomControl: false, attributionControl: true }).setView([start.lat, start.lon], 11);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.on("moveend", () => { const center = map.getCenter(); centerRef.current = { lat: center.lat, lon: center.lng }; setMoved(true); });
      navigator.geolocation?.getCurrentPosition(({ coords }) => {
        if (!mapRef.current) return;
        userRef.current = L.circleMarker([coords.latitude, coords.longitude], { radius: 8, color: "#fff", weight: 3, fillColor: "#1269d3", fillOpacity: 1 }).addTo(map).bindTooltip("Tu ubicación");
      }, () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
    }
    mount();
    return () => { active = false; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    let active = true;
    import("leaflet").then(module => {
      if (!active || !mapRef.current || !markersRef.current) return;
      const L = module.default;
      markersRef.current.clearLayers();
      visible.forEach(route => {
        if (!Number.isFinite(Number(route.lat)) || !Number.isFinite(Number(route.lon))) return;
        const done = Boolean(completed[route.id]?.trophy_earned), downloaded = isDownloaded(route.id);
        L.circleMarker([route.lat, route.lon], { radius: done ? 10 : 8, color: done ? "#d5a62e" : "#fff", weight: done ? 4 : 2, fillColor: COLORS[route.level] || COLORS.principiante, fillOpacity: .95 })
          .bindTooltip(route.name)
          .on("click", () => setPreview({ ...route, downloaded, done }))
          .addTo(markersRef.current);
      });
    });
    return () => { active = false; };
  }, [visible, completed, mapReady]);

  async function searchHere() {
    const center = centerRef.current;
    setLoading(true); setError(""); setPreview(null);
    try {
      const params = new URLSearchParams({ lat: String(center.lat), lon: String(center.lon), radius: "50000", limit: "200", v: "2026-08-26-national-catalog-v1" });
      const response = await fetch(`/api/routes?${params}`, { cache: "no-store" }), body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se han podido buscar rutas en esta zona.");
      setRoutes(body.routes || []); setMoved(false);
      if (!(body.routes || []).length) setError("No hay rutas publicadas en esta zona.");
    } catch (reason) { setError(reason.message || "No se han podido cargar las rutas."); }
    finally { setLoading(false); }
  }

  function locate() {
    if (!navigator.geolocation) return setError("Este dispositivo no permite obtener tu ubicación.");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      mapRef.current?.setView([coords.latitude, coords.longitude], 13, { animate: true });
    }, () => setError("Activa el permiso de ubicación para centrar el mapa."), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  return <div className="routeMapExplorer" role="dialog" aria-modal="true" aria-label="Mapa de rutas">
    <div ref={nodeRef} className="routeMapCanvas" />
    <header><button onClick={close} aria-label="Volver">‹</button><div><small>RUTAS SOBRE EL TERRENO</small><h1>Mapa</h1></div><button onClick={locate} aria-label="Centrar en mi ubicación">⌖</button></header>
    <div className="mapFilters" aria-label="Filtros del mapa">
      <select value={level} onChange={event => setLevel(event.target.value)} aria-label="Dificultad"><option value="todas">Dificultad</option><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="experto">Experto</option></select>
      <select value={maxDistance} onChange={event => setMaxDistance(event.target.value)} aria-label="Distancia máxima"><option value="todas">Distancia</option><option value="5">Hasta 5 km</option><option value="10">Hasta 10 km</option><option value="20">Hasta 20 km</option></select>
      <button className={circular ? "enabled" : ""} onClick={() => setCircular(value => !value)} aria-pressed={circular}>Circular</button>
    </div>
    <div className="mapLegend"><span><i className="easy"/>Fácil</span><span><i className="medium"/>Intermedia</span><span><i className="hard"/>Experta</span><span><i className="done"/>Completada</span></div>
    {moved && <button className="searchMapArea" onClick={searchHere} disabled={loading}>{loading ? "Buscando…" : "Buscar en esta zona"}</button>}
    {error && <p className="mapExplorerError">{error}</p>}
    {!error && !visible.length && <p className="mapExplorerError">No hay rutas que coincidan con estos filtros.</p>}
    <span className="mapRouteCount">{visible.length} rutas visibles</span>
    {preview && <article className="mapRoutePreview">
      <button className="closePreview" onClick={() => setPreview(null)} aria-label="Cerrar ficha">×</button>
      <div><span className={`routeLevel routeLevel-${preview.level}`}>{LABELS[preview.level]}</span>{preview.done && <span className="mapStatus">🏆 Completada</span>}{preview.downloaded && <span className="mapStatus">↓ Offline</span>}</div>
      <h2>{preview.name}</h2>
      <p><b>{Number(preview.distanceKm).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km</b><b>+{Number(preview.ascentM).toLocaleString("es-ES")} m</b><b>{preview.duration}</b></p>
      <button className="openMapRoute" onClick={() => select(preview)}>Ver ruta</button>
    </article>}
  </div>;
}
