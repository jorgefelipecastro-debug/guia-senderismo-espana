const DB_NAME = "encumbrate-moments";
const STORE = "pending-media";

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode), store = tx.objectStore(STORE), result = action(store);
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
export const savePendingMoment = item => transaction("readwrite", store => store.put(item));
export const removePendingMoment = id => transaction("readwrite", store => store.delete(id));
export const readPendingMoments = () => transaction("readonly", store => store.getAll()).then(items => items || []);
