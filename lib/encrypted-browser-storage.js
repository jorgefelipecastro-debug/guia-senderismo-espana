const DATABASE = "encumbrate-secure";
const VERSION = 1;
const KEY_ID = "aes-gcm-v1";
const PREFIX = "enc:v1:";

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
function database() {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB no está disponible."));
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys", {keyPath: "id"});
      if (!db.objectStoreNames.contains("vault")) db.createObjectStore("vault", {keyPath: "key"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacén cifrado."));
  });
  return databasePromise;
}

let keyPromise;
async function encryptionKey() {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    const db = await database(), read = db.transaction("keys", "readonly"),
      current = await requestResult(read.objectStore("keys").get(KEY_ID));
    await transactionDone(read);
    if (current?.key) return current.key;
    const key = await crypto.subtle.generateKey({name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]),
      write = db.transaction("keys", "readwrite");
    write.objectStore("keys").put({id: KEY_ID, key});
    await transactionDone(write);
    return key;
  })();
  return keyPromise;
}

const toBase64 = (bytes) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
};
const fromBase64 = (value) => Uint8Array.from(atob(value), character => character.charCodeAt(0));

export async function encryptBrowserValue(value) {
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    ciphertext = await crypto.subtle.encrypt({name: "AES-GCM", iv}, await encryptionKey(), new TextEncoder().encode(value));
  return `${PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptBrowserValue(value) {
  if (!value.startsWith(PREFIX)) return value;
  const [iv, ciphertext] = value.slice(PREFIX.length).split("."),
    plaintext = await crypto.subtle.decrypt(
      {name: "AES-GCM", iv: fromBase64(iv)}, await encryptionKey(), fromBase64(ciphertext),
    );
  return new TextDecoder().decode(plaintext);
}

export const encryptedBrowserStorage = {
  async getItem(key) {
    if (typeof indexedDB === "undefined") return null;
    const db = await database(), transaction = db.transaction("vault", "readonly"),
      record = await requestResult(transaction.objectStore("vault").get(key));
    await transactionDone(transaction);
    if (record?.value) return decryptBrowserValue(record.value);
    const legacy = typeof localStorage === "undefined" ? null : localStorage.getItem(key);
    if (legacy != null) {
      await encryptedBrowserStorage.setItem(key, legacy);
      localStorage.removeItem(key);
    }
    return legacy;
  },
  async setItem(key, value) {
    const db = await database(), encrypted = await encryptBrowserValue(value),
      transaction = db.transaction("vault", "readwrite");
    transaction.objectStore("vault").put({key, value: encrypted});
    await transactionDone(transaction);
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
  async removeItem(key) {
    if (typeof indexedDB !== "undefined") {
      const db = await database(), transaction = db.transaction("vault", "readwrite");
      transaction.objectStore("vault").delete(key);
      await transactionDone(transaction);
    }
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
};
