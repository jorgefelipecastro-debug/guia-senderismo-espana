import { createClient } from '@supabase/supabase-js';
import {encryptedAsyncStorage} from '../security/encryptedStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) throw new Error('Faltan las variables públicas de Supabase.');

export const supabase = createClient(url, key, {
  auth: {
    storage: encryptedAsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
