import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)

const isSSR = typeof window === 'undefined'

const ExpoWebSecureStoreAdapter = {
  getItem: (k: string) => {
    if (isSSR) return null
    return AsyncStorage.getItem(k)
  },
  setItem: (k: string, value: string) => {
    if (isSSR) return
    return AsyncStorage.setItem(k, value)
  },
  removeItem: (k: string) => {
    if (isSSR) return
    return AsyncStorage.removeItem(k)
  },
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon', {
  auth: {
    storage: ExpoWebSecureStoreAdapter,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
})
