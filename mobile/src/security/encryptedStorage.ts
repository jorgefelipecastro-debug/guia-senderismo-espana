import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const MASTER_KEY_NAME = 'encumbrate.data-key.v1';
const ENVELOPE_PREFIX = 'enc:v1:';
let keyPromise: Promise<AESEncryptionKey> | null = null;

async function encryptionKey() {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    const stored = await SecureStore.getItemAsync(MASTER_KEY_NAME);
    if (stored) return AESEncryptionKey.import(stored, 'base64');
    const generated = await AESEncryptionKey.generate(256);
    const encoded = await generated.encoded('base64');
    await SecureStore.setItemAsync(MASTER_KEY_NAME, encoded, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    return generated;
  })();
  return keyPromise;
}

export function isEncryptedValue(value: string) {
  return value.startsWith(ENVELOPE_PREFIX);
}

export async function encryptString(value: string) {
  const sealed = await aesEncryptAsync(
    new TextEncoder().encode(value),
    await encryptionKey(),
  );
  return `${ENVELOPE_PREFIX}${await sealed.combined('base64')}`;
}

export async function decryptString(value: string) {
  if (!isEncryptedValue(value)) return value;
  const sealed = AESSealedData.fromCombined(value.slice(ENVELOPE_PREFIX.length));
  const plaintext = await aesDecryptAsync(sealed, await encryptionKey(), {output: 'bytes'});
  return new TextDecoder().decode(plaintext as Uint8Array);
}

export async function encryptJson(value: unknown) {
  return encryptString(JSON.stringify(value));
}

export async function decryptJson<T>(value: string): Promise<T> {
  return JSON.parse(await decryptString(value)) as T;
}

export const encryptedAsyncStorage = {
  async getItem(key: string) {
    const stored = await AsyncStorage.getItem(key);
    if (stored == null) return null;
    if (isEncryptedValue(stored)) return decryptString(stored);
    await AsyncStorage.setItem(key, await encryptString(stored));
    return stored;
  },
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, await encryptString(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async multiRemove(keys: string[]) {
    await AsyncStorage.multiRemove(keys);
  },
};
