import {decryptBrowserValue, encryptBrowserValue} from "./encrypted-browser-storage.js";

const DATABASE = "encumbrate-gps";
const VERSION = 2;
const ACTIVE_KEY = "active-session";
export const LEGACY_GPS_SESSION_KEY = "encumbrate:active-gps-session";
const MAX_POINTS = 20000;

const requestResult = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("IndexedDB error"));
});
const transactionDone = (transaction) => new Promise((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction error"));
  transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
});

let databasePromise;
function openDatabase() {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB no está disponible."));
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("state")) database.createObjectStore("state", {keyPath: "key"});
      if (!database.objectStoreNames.contains("points")) {
        const points = database.createObjectStore("points", {keyPath: "id"});
        points.createIndex("sessionId", "sessionId", {unique: false});
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB."));
    request.onblocked = () => reject(new Error("La base GPS está bloqueada por otra pestaña."));
  });
  return databasePromise;
}

const withoutPointArrays = (session) => {
  const {points, pending, ...metadata} = session;
  return metadata;
};
const encryptJson = (value) => encryptBrowserValue(JSON.stringify(value));
const decryptJson = async (value) => JSON.parse(await decryptBrowserValue(value));

async function replacePoints(database, session) {
  const metadataPayload = await encryptJson(withoutPointArrays(session)),
    pendingSequences = new Set((session.pending || []).map(point => point.sequence)),
    source = (session.points || []).map((point, index) => ({
      ...point, sequence: Number(point.sequence || index + 1),
    }));
  for (const pending of session.pending || [])
    if (!source.some(point => point.sequence === pending.sequence)) source.push(pending);
  const encryptedPoints = await Promise.all(source.slice(-MAX_POINTS).map(async point => ({
    point, payload: await encryptJson(point),
  })));
  const transaction = database.transaction(["state", "points"], "readwrite"),
    state = transaction.objectStore("state"), pointsStore = transaction.objectStore("points"),
    index = pointsStore.index("sessionId"), existing = await requestResult(index.getAllKeys(session.id));
  for (const key of existing) pointsStore.delete(key);
  for (const {point, payload} of encryptedPoints)
    pointsStore.put({
      id: `${session.id}:${point.sequence}`, sessionId: session.id,
      sequence: point.sequence, pending: pendingSequences.has(point.sequence), payload,
    });
  state.put({key: ACTIVE_KEY, payload: metadataPayload});
  await transactionDone(transaction);
}

async function migrateLegacy(database) {
  if (typeof localStorage === "undefined") return;
  const transaction = database.transaction("state", "readonly"),
    current = await requestResult(transaction.objectStore("state").get(ACTIVE_KEY));
  await transactionDone(transaction);
  if (current?.session || current?.payload) return;
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_GPS_SESSION_KEY) || "null"); } catch {}
  if (!legacy?.id) return;
  await replacePoints(database, legacy);
  localStorage.removeItem(LEGACY_GPS_SESSION_KEY);
}

async function migratePlaintext(database) {
  const read = database.transaction(["state", "points"], "readonly"),
    state = await requestResult(read.objectStore("state").get(ACTIVE_KEY)),
    points = state?.session
      ? await requestResult(read.objectStore("points").index("sessionId").getAll(state.session.id)) : [];
  await transactionDone(read);
  if (state?.session) {
    const clean = ({id, sessionId, pending, payload, ...point}) => point,
      session = {
        ...state.session,
        points: points.map(clean),
        pending: points.filter(point => point.pending).map(clean),
      };
    await replacePoints(database, session);
  }
}

async function database() {
  const value = await openDatabase();
  await migrateLegacy(value);
  await migratePlaintext(value);
  return value;
}

export async function readGpsSession() {
  const db = await database(), stateTransaction = db.transaction("state", "readonly"),
    state = await requestResult(stateTransaction.objectStore("state").get(ACTIVE_KEY));
  await transactionDone(stateTransaction);
  if (!state?.payload) {
    return null;
  }
  const metadata = await decryptJson(state.payload),
    pointsTransaction = db.transaction("points", "readonly"),
    stored = await requestResult(pointsTransaction.objectStore("points").index("sessionId").getAll(metadata.id));
  await transactionDone(pointsTransaction);
  const ordered = stored.sort((a, b) => a.sequence - b.sequence),
    decrypted = await Promise.all(ordered.map(point => decryptJson(point.payload)));
  return {
    ...metadata,
    points: decrypted,
    pending: decrypted.filter((_, index) => ordered[index].pending),
  };
}

export async function writeGpsSession(session, {replace = false} = {}) {
  const db = await database();
  if (replace) return replacePoints(db, session);
  const payload = await encryptJson(withoutPointArrays(session));
  const transaction = db.transaction("state", "readwrite");
  transaction.objectStore("state").put({key: ACTIVE_KEY, payload});
  await transactionDone(transaction);
}

export async function appendGpsPoint(session, point) {
  const db = await database(), payload = await encryptJson(point),
    metadataPayload = await encryptJson(withoutPointArrays({...session, sequence: point.sequence})),
    transaction = db.transaction(["state", "points"], "readwrite");
  transaction.objectStore("points").put({
    id: `${session.id}:${point.sequence}`, sessionId: session.id,
    sequence: point.sequence, pending: true, payload,
  });
  transaction.objectStore("state").put({key: ACTIVE_KEY, payload: metadataPayload});
  await transactionDone(transaction);
}

export async function markPendingGpsPointsSent(sessionId, count) {
  if (!count) return;
  const db = await database(), transaction = db.transaction("points", "readwrite"),
    store = transaction.objectStore("points"),
    records = await requestResult(store.index("sessionId").getAll(sessionId));
  for (const point of records.filter(item => item.pending).sort((a,b) => a.sequence-b.sequence).slice(0,count))
    store.put({...point, pending: false});
  await transactionDone(transaction);
}

export async function clearGpsSession() {
  const db = await database(), read = db.transaction("state", "readonly"),
    state = await requestResult(read.objectStore("state").get(ACTIVE_KEY));
  await transactionDone(read);
  const session = state?.payload ? await decryptJson(state.payload) : null,
    transaction = db.transaction(["state", "points"], "readwrite");
  transaction.objectStore("state").delete(ACTIVE_KEY);
  if (session?.id) {
    const store = transaction.objectStore("points"),
      keys = await requestResult(store.index("sessionId").getAllKeys(session.id));
    for (const key of keys) store.delete(key);
  }
  await transactionDone(transaction);
}

export async function requestPersistentGpsStorage() {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try { return await navigator.storage.persist(); } catch { return false; }
}
