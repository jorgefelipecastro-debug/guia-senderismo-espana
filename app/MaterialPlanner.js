"use client";
import { useEffect, useMemo, useState } from "react";
import { buildMaterialList, MATERIAL_STORAGE_KEY, preparationSummary, SHOP_CATALOG } from "../lib/material-planner";
import "./material-planner.css";

const EMPTY_STATE = { packed: {}, backpack: [], saved: [] };
const CONDITION_LABELS = [
  ["rain", "☂", "Lluvia"], ["cold", "❄", "Frío"], ["heat", "☀", "Calor"], ["night", "◐", "Poca luz"], ["pet", "🐾", "Con mascota"],
];

function loadState() {
  try { return { ...EMPTY_STATE, ...JSON.parse(localStorage.getItem(MATERIAL_STORAGE_KEY) || "{}") }; }
  catch { return EMPTY_STATE; }
}

export default function MaterialPlanner({ route, close }) {
  const [tab, setTab] = useState("prepare"), [conditions, setConditions] = useState({}), [state, setState] = useState(EMPTY_STATE), [custom, setCustom] = useState(""), [message, setMessage] = useState("");
  useEffect(() => setState(loadState()), []);
  const list = useMemo(() => buildMaterialList(route, conditions), [route, conditions]);
  const summary = preparationSummary(list, state.packed);
  function persist(next) { setState(next); localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(next)); }
  function mark(id, value) { persist({ ...state, packed: { ...state.packed, [id]: state.packed[id] === value ? "" : value } }); }
  function addCustom(event) { event.preventDefault(); const name = custom.trim(); if (!name) return; persist({ ...state, backpack: [...state.backpack, { id: crypto.randomUUID(), name }] }); setCustom(""); }
  function saveList() { const saved = { id: crypto.randomUUID(), name: route?.name || `Lista ${new Date().toLocaleDateString("es-ES")}`, at: new Date().toISOString(), packed: state.packed, conditions }; persist({ ...state, saved: [saved, ...state.saved].slice(0, 20) }); setMessage("Lista guardada en este dispositivo."); }
  function restore(saved) { persist({ ...state, packed: saved.packed || {} }); setConditions(saved.conditions || {}); setTab("prepare"); setMessage(`Lista «${saved.name}» recuperada.`); }
  return <section className="materialScreen" role="dialog" aria-modal="true" aria-label="Preparar material de montaña">
    <header><button onClick={close} aria-label="Volver">‹</button><div><small>PREPARA · REVISA · SAL SEGURO</small><h1>Material</h1></div><span>🎒</span></header>
    <nav className="materialTabs" aria-label="Secciones de material"><button className={tab === "prepare" ? "active" : ""} onClick={() => setTab("prepare")}>Preparar</button><button className={tab === "backpack" ? "active" : ""} onClick={() => setTab("backpack")}>Mi mochila</button><button className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>Recomendado</button></nav>
    <main>
      {message && <p className="materialMessage" role="status">{message}</p>}
      {tab === "prepare" && <>
        <section className="materialRoute"><small>{route ? "LISTA ADAPTADA A ESTA RUTA" : "LISTA GENERAL DE MONTAÑA"}</small><h2>{route?.name || "Prepara tu próxima salida"}</h2>{route ? <div><span>{route.distanceKm ? `${Number(route.distanceKm).toLocaleString("es-ES", { maximumFractionDigits: 1 })} km` : "Distancia pendiente"}</span><span>{route.ascentM ? `+${Math.round(route.ascentM)} m` : "Desnivel pendiente"}</span><span>{route.duration || "Duración pendiente"}</span></div> : <p>Abre Material desde la ficha de una ruta para ajustar automáticamente la lista.</p>}</section>
        <section className="conditionPicker"><h2>Condiciones previstas</h2><p>Márcalas antes de salir. Comprueba siempre la previsión oficial.</p><div>{CONDITION_LABELS.map(([id, icon, label]) => <button key={id} className={conditions[id] ? "active" : ""} aria-pressed={Boolean(conditions[id])} onClick={() => setConditions(current => ({ ...current, [id]: !current[id] }))}><span>{icon}</span>{label}</button>)}</div></section>
        <section className={`readinessCard ${summary.missingEssential ? "warning" : "ready"}`}><div><strong>{summary.percent}% preparado</strong><small>{summary.prepared} de {summary.total} elementos</small></div><b>{summary.missingEssential ? `${summary.missingEssential} esenciales pendientes` : "Esenciales preparados"}</b></section>
        <div className="materialChecklist">{list.map(item => <article key={item.id} className={state.packed[item.id] || ""}><button className="materialCheck" onClick={() => mark(item.id, "packed")} aria-label={`Marcar ${item.name} como preparado`}>{state.packed[item.id] === "packed" ? "✓" : ""}</button><div><small>{item.category}{item.essential ? " · ESENCIAL" : ""}</small><strong>{item.name}</strong><span>{item.detail}</span></div><button className="materialSkip" onClick={() => mark(item.id, "skip")}>{state.packed[item.id] === "skip" ? "Restaurar" : "No necesario"}</button></article>)}</div>
        <button className="saveMaterialList" onClick={saveList}>Guardar esta lista</button>
        {state.saved.length > 0 && <section className="savedMaterial"><h2>Listas guardadas</h2>{state.saved.map(saved => <button key={saved.id} onClick={() => restore(saved)}><span><strong>{saved.name}</strong><small>{new Date(saved.at).toLocaleDateString("es-ES")}</small></span><b>Recuperar</b></button>)}</section>}
      </>}
      {tab === "backpack" && <><section className="materialIntro"><small>TU EQUIPO HABITUAL</small><h2>Mi mochila</h2><p>Registra lo que ya tienes. Así, más adelante podremos avisarte únicamente de lo que te falta.</p></section><form className="customMaterial" onSubmit={addCustom}><input value={custom} onChange={event => setCustom(event.target.value)} maxLength="80" placeholder="Ej. cortavientos, cantimplora…"/><button>Añadir</button></form><div className="backpackList">{state.backpack.length ? state.backpack.map(item => <article key={item.id}><span>✓</span><strong>{item.name}</strong><button aria-label={`Eliminar ${item.name}`} onClick={() => persist({ ...state, backpack: state.backpack.filter(saved => saved.id !== item.id) })}>×</button></article>) : <p>Aún no has añadido material a tu mochila.</p>}</div><div className="materialSafetyNote"><b>Revisión periódica</b><span>Comprueba caducidad del botiquín, baterías, costuras, suelas y daños antes de cada salida.</span></div></>}
      {tab === "shop" && <><section className="materialIntro"><small>ELECCIÓN RESPONSABLE</small><h2>Material recomendado</h2><p>Guía para comparar ropa y accesorios adecuados. Las compras todavía no están activadas.</p></section><div className="shopCatalog">{SHOP_CATALOG.map(product => <article key={product.id}><span>{product.icon}</span><div><small>{product.category}</small><h3>{product.name}</h3><p>{product.reason}</p></div><button disabled>{product.status === "review-required" ? "Pendiente de validar" : "Comparar próximamente"}</button></article>)}</div><div className="futureShop"><small>FUTURA TIENDA ENCÚMBRATE</small><h2>Preparada, pero no activada</h2><p>Solo se incorporarán productos después de verificar proveedor, muestras, trazabilidad, seguridad, responsable en la UE y sistema de devoluciones. No hay pagos, afiliación ni costes activos.</p></div></>}
    </main>
  </section>;
}
