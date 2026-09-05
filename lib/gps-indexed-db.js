const DATABASE = "encumbrate-gps";
const VERSION = 1;
const ACTIVE_KEY = "active-session";
export const LEGACY_GPS_SESSION_KEY = "encumbrate:active-gps-session";
const MAX_POINTS = 20000;

const requestResult = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB error"));
  });

const transactionDone = (transaction) =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction error"));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
  });

let databasePromise;
function openDatabase() {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("IndexedDB no está disponible."));
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("state"))
        database.createObjectStore("state", { keyPath: "key" });
      if (!database.objectStoreNames.contains("points")) {
        const points = database.createObjectStore("points", { keyPath: "id" });
        points.createIndex("sessionId", "sessionId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB."));
    request.onblocked = () => reject(new Error("La base GPS está bloqueada por otra pestaña."));
  });
  return databasePromise;
}

const withoutPointArrays = (session) => {
  const { points, pending, ...metadata } = session;
  return metadata;
};

async function replacePoints(database, session) {
  const transaction = database.transaction(["state", "points"], "readwrite"),
    state = transaction.objectStore("state"),
    pointsStore = transaction.objectStore("points"),
    index = pointsStore.index("sessionId"),
    existing = await requestResult(index.getAllKeys(session.id));
  for (const key of existing) pointsStore.delete(key);
  const pendingSequences = new Set((session.pending || []).map((point) => point.sequence));
  const source = (session.points || []).map((point, index) => ({
    ...point,
    sequence: Number(point.sequence || index + 1),
  }));
  for (const pending of session.pending || [])
    if (!source.some((point) => point.sequence === pending.sequence)) source.push(pending);
  for (const point of source.slice(-MAX_POINTS))
    pointsStore.put({
      ...point,
      id: `${session.id}:${point.sequence}`,
      sessionId: session.id,
      pending: pendingSequences.has(point.sequence),
    });
  state.put({ key: ACTIVE_KEY, session: withoutPointArrays(session) });
  await transactionDone(transaction);
}

async function migrateLegacy(database) {
  if (typeof localStorage === "undefined") return;
  const transaction = database.transaction("state", "readonly"),
    current = await requestResult(transaction.objectStore("state").get(ACTIVE_KEY));
  await transactionDone(transaction);
  if (current?.session) return;
  let legacy = null;
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_GPS_SESSION_KEY) || "null");
  } catch {}
  if (!legacy?.id) return;
  await replacePoints(database, legacy);
  localStorage.removeItem(LEGACY_GPS_SESSION_KEY);
}

async function database() {
  const value = await openDatabase();
  await migrateLegacy(value);
  return value;
}

export async function readGpsSession() {
  const db = await database(),
    transaction = db.transaction(["state", "points"], "readonly"),
    state = await requestResult(transaction.objectStore("state").get(ACTIVE_KEY));
  if (!state?.session) {
    await transactionDone(transaction);
    return null;
  }
  const stored = await requestResult(
    transaction.objectStore("points").index("sessionId").getAll(state.session.id),
  );
  await transactionDone(transaction);
  const ordered = stored.sort((a, b) => a.sequence - b.sequence),
    clean = ({ id, sessionId, pending, ...point }) => point;
  return {
    ...state.session,
    points: ordered.map(clean),
    pending: ordered.filter((point) => point.pending).map(clean),
  };
}

export async function writeGpsSession(session, { replace = false } = {}) {
  const db = await database();
  if (replace) return replacePoints(db, session);
  const transaction = db.transaction("state", "readwrite");
  transaction.objectStore("state").put({
    key: ACTIVE_KEY,
    session: withoutPointArrays(session),
  });
  await transactionDone(transaction);
}

export async function appendGpsPoint(session, point) {
  const db = await database(),
    transaction = db.transaction(["state", "points"], "readwrite");
  transaction.objectStore("points").put({
    ...point,
    id: `${session.id}:${point.sequence}`,
    sessionId: session.id,
    pending: true,
  });
  transaction.objectStore("state").put({
    key: ACTIVE_KEY,
    session: withoutPointArrays({ ...session, sequence: point.sequence }),
  });
  await transactionDone(transaction);
}

export async function markPendingGpsPointsSent(sessionId, count) {
  if (!count) return;
  const db = await database(),
    transaction = db.transaction("points", "readwrite"),
    store = transaction.objectStore("points"),
    records = await requestResult(store.index("sessionId").getAll(sessionId));
  for (const point of records
    .filter((item) => item.pending)
    .sort((a, b) => a.sequence - b.sequence)
    .slice(0, count))
    store.put({ ...point, pending: false });
  await transactionDone(transaction);
}

export async function clearGpsSession() {
  const db = await database(),
    transaction = db.transaction(["state", "points"], "readwrite"),
    state = await requestResult(transaction.objectStore("state").get(ACTIVE_KEY));
  transaction.objectStore("state").delete(ACTIVE_KEY);
  if (state?.session?.id) {
    const store = transaction.objectStore("points"),
      keys = await requestResult(store.index("sessionId").getAllKeys(state.session.id));
    for (const key of keys) store.delete(key);
  }
  await transactionDone(transaction);
}

export async function requestPersistentGpsStorage() {
  if (typeof navigator === "undefined" || !navigator.storage?.persist)
    return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
