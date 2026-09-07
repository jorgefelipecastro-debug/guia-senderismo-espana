"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { readPendingMoments, removePendingMoment, savePendingMoment } from "../lib/moments-offline";
import "./moments.css";

const MAX_IMAGE = 15 * 1024 * 1024, MAX_VIDEO = 100 * 1024 * 1024;
const MOMENTS_PAGE_SIZE = 24;
function extension(file) { return (file.name?.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6); }
async function prepareImage(file) {
  if (!file.type.startsWith("image/") || file.size < 2 * 1024 * 1024) return file;
  const source = await createImageBitmap(file), scale = Math.min(1, 2048 / Math.max(source.width, source.height)), canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale); canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height); source.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", .84));
  return blob && blob.size < file.size ? new File([blob], `${file.name || "momento"}.webp`, { type: "image/webp" }) : file;
}

export default function Moments({ user, close }) {
  const [items, setItems] = useState([]), [pending, setPending] = useState([]), [routes, setRoutes] = useState([]), [album, setAlbum] = useState(""), [busy, setBusy] = useState(false), [loadingMore, setLoadingMore] = useState(false), [hasMore, setHasMore] = useState(false), [message, setMessage] = useState(""), [selected, setSelected] = useState(null), cameraPhoto = useRef(null), cameraVideo = useRef(null), gallery = useRef(null);
  const albums = useMemo(() => Object.entries(items.reduce((map, item) => { const key = item.route_name || "Momentos sin ruta"; (map[key] ||= []).push(item); return map; }, {})), [items]);
  useEffect(() => { load(); readPendingMoments().then(items => { setPending(items); if (navigator.onLine && items.length) flush(); }).catch(() => {}); const online = () => flush(); window.addEventListener("online", online); return () => window.removeEventListener("online", online); }, [user.id]);
  async function load(offset = 0, append = false) {
    if (append) setLoadingMore(true);
    const [media, activity] = await Promise.all([supabase.from("moments").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + MOMENTS_PAGE_SIZE - 1), supabase.from("route_activities").select("id,route_name,distance_km,duration_seconds,ended_at").eq("user_id", user.id).order("started_at", { ascending: false }).limit(50)]);
    if (media.error) { setLoadingMore(false); return setMessage("Momentos estará disponible cuando se aplique su actualización de seguridad."); }
    const signed = await Promise.all((media.data || []).map(async item => { const { data } = await supabase.storage.from("moments").createSignedUrl(item.storage_path, 3600); return { ...item, url: data?.signedUrl || "" }; }));
    setItems(current => append ? [...current, ...signed.filter(item => !current.some(saved => saved.id === item.id))] : signed); setRoutes(activity.data || []); setHasMore((media.data || []).length === MOMENTS_PAGE_SIZE); setLoadingMore(false);
  }
  async function uploadRecord(record) {
    const path = `${user.id}/${record.id}.${extension(record.file)}`, mediaType = record.file.type.startsWith("video/") ? "video" : "photo";
    const { error: uploadError } = await supabase.storage.from("moments").upload(path, record.file, { contentType: record.file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { error } = await supabase.from("moments").insert({ id: record.id, user_id: user.id, storage_path: path, media_type: mediaType, mime_type: record.file.type, file_size: record.file.size, route_activity_id: record.routeActivityId || null, route_name: record.routeName || null, captured_at: record.capturedAt });
    if (error) { await supabase.storage.from("moments").remove([path]); throw error; }
  }
  async function addFiles(fileList) {
    const files = [...(fileList || [])]; if (!files.length) return;
    setBusy(true); setMessage("");
    for (const original of files) {
      try {
        const file = await prepareImage(original), video = file.type.startsWith("video/");
        if ((!video && file.size > MAX_IMAGE) || (video && file.size > MAX_VIDEO)) throw new Error(video ? "El vídeo supera 100 MB." : "La fotografía supera 15 MB.");
        const allowed = ["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime","video/3gpp"];
        if (!allowed.includes(file.type)) throw new Error("Este formato no es compatible. Usa JPG, PNG, WebP, MP4, WebM, MOV o 3GP.");
        const chosen = routes.find(route => String(route.id) === String(album));
        const record = { id: crypto.randomUUID(), file, routeActivityId: chosen?.id || null, routeName: chosen?.route_name || null, capturedAt: new Date().toISOString() };
        if (!navigator.onLine) { await savePendingMoment(record); setPending(await readPendingMoments()); setMessage("Guardado en el teléfono. Se subirá cuando vuelva la conexión."); }
        else await uploadRecord(record);
      } catch (error) { setMessage(error.message || "No hemos podido guardar uno de los archivos."); }
    }
    setBusy(false); if (navigator.onLine) await load();
  }
  async function flush() {
    if (!navigator.onLine) return; const queued = await readPendingMoments().catch(() => []); if (!queued.length) return;
    setBusy(true); setMessage("Subiendo momentos guardados sin conexión…");
    for (const record of queued) { try { await uploadRecord(record); await removePendingMoment(record.id); } catch { break; } }
    setPending(await readPendingMoments().catch(() => [])); setBusy(false); await load();
  }
  async function update(id, changes) { const { error } = await supabase.from("moments").update(changes).eq("id", id).eq("user_id", user.id); if (error) return setMessage("No hemos podido guardar el cambio."); await load(); setSelected(current => current?.id === id ? { ...current, ...changes } : current); }
  async function remove(item) { if (!confirm("¿Eliminar definitivamente este momento?")) return; setBusy(true); const { error } = await supabase.from("moments").delete().eq("id", item.id).eq("user_id", user.id); if (!error) await supabase.storage.from("moments").remove([item.storage_path]); setSelected(null); setBusy(false); await load(); }
  function summaryFor(name) { return routes.find(route => route.route_name === name) || null; }
  async function shareAlbum(name, media) { const route = summaryFor(name), details = route ? ` · ${Number(route.distance_km || 0).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km · ${Math.round(Number(route.duration_seconds || 0) / 60)} min` : "", text = `${name} · ${media.length} ${media.length === 1 ? "momento" : "momentos"}${details} · Encúmbrate`; if (navigator.share) await navigator.share({ title: name, text }); else { await navigator.clipboard?.writeText(text); setMessage("Resumen copiado para compartir."); } }
  return <section className="momentsScreen" role="dialog" aria-modal="true"><header><button onClick={close} aria-label="Volver">‹</button><div><small>TUS AVENTURAS</small><h1>Momentos</h1></div><span>{items.length}</span></header>
    <main><section className="momentsCapture"><h2>Guarda este momento</h2><p>Privado por defecto. Tú decides si lo compartes después.</p><select value={album} onChange={event => setAlbum(event.target.value)}><option value="">Sin asociar a una ruta</option>{routes.map(route => <option value={route.id} key={route.id}>{route.route_name}</option>)}</select><div><button onClick={() => cameraPhoto.current?.click()}>📷 Hacer foto</button><button onClick={() => cameraVideo.current?.click()}>● Grabar vídeo</button><button onClick={() => gallery.current?.click()}>▣ Galería</button></div><input ref={cameraPhoto} hidden type="file" accept="image/*" capture="environment" onChange={event => addFiles(event.target.files)}/><input ref={cameraVideo} hidden type="file" accept="video/*" capture="environment" onChange={event => addFiles(event.target.files)}/><input ref={gallery} hidden multiple type="file" accept="image/*,video/*" onChange={event => addFiles(event.target.files)}/></section>
      {pending.length > 0 && <div className="momentsPending">⌛ {pending.length} pendiente{pending.length === 1 ? "" : "s"} de subir</div>}{busy && <div className="momentsBusy">Guardando…</div>}{message && <p className="momentsMessage">{message}</p>}
      {albums.length ? albums.map(([name, media]) => { const summary = summaryFor(name); return <section className="momentAlbum" key={name}><div className="albumTitle"><div><small>ÁLBUM</small><h2>{name}</h2><span>{media.length} archivos cargados{summary ? ` · ${Number(summary.distance_km || 0).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km · ${Math.round(Number(summary.duration_seconds || 0) / 60)} min` : ""}</span></div><button onClick={() => shareAlbum(name, media)}>Compartir resumen</button></div><div className="momentsGrid">{media.map(item => <button key={item.id} onClick={() => setSelected(item)}>{item.media_type === "video" ? <video src={item.url} muted preload="metadata"/> : <img src={item.url} alt={item.caption || "Momento de montaña"}/>}<span>{item.favorite ? "★" : item.media_type === "video" ? "▶" : ""}</span></button>)}</div></section>; }) : !busy && <div className="momentsEmpty"><b>Tu primer recuerdo empieza aquí</b><p>Haz una fotografía o graba un vídeo durante tu próxima aventura.</p></div>}{hasMore&&<button className="momentsMore" disabled={loadingMore} onClick={()=>load(items.length,true)}>{loadingMore?'Cargando…':'Ver más momentos'}</button>}
    </main>{selected && <div className="momentViewer"><header><button onClick={() => setSelected(null)}>‹</button><strong>{selected.route_name || "Momento"}</strong><button onClick={() => update(selected.id, { favorite: !selected.favorite })}>{selected.favorite ? "★" : "☆"}</button></header>{selected.media_type === "video" ? <video src={selected.url} controls playsInline/> : <img src={selected.url} alt={selected.caption || "Momento de montaña"}/>}<section><textarea maxLength="280" defaultValue={selected.caption || ""} placeholder="Escribe qué recuerdas…" onBlur={event => update(selected.id, { caption: event.target.value.trim() })}/><button className={selected.visibility === "community" ? "published" : ""} onClick={() => update(selected.id, { visibility: selected.visibility === "community" ? "private" : "community", published_at: selected.visibility === "community" ? null : new Date().toISOString() })}>{selected.visibility === "community" ? "✓ Compartido con la comunidad" : "Compartir en la red social"}</button><button className="deleteMoment" onClick={() => remove(selected)}>Eliminar momento</button></section></div>}</section>;
}
