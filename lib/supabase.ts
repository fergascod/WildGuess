import { createClient } from '@supabase/supabase-js'
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)

const ExpoSecureStoreAdapter = {
  getItem: (k: string) => getItemAsync(k),
  setItem: (k: string, value: string) => {
    if (value.length > 2048) {
      console.warn(
        'Value being stored in SecureStore is larger than 2048 bytes and may not be stored successfully.'
      )
    }
    return setItemAsync(k, value)
  },
  removeItem: (k: string) => deleteItemAsync(k),
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon', {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
})
