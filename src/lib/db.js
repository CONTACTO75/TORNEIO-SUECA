import { createClient } from '@supabase/supabase-js'
import { createLocalDb } from './localDb'
import { createSupabaseDb } from './supabaseDb'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isLocalMode = !(url && key)
export const db = isLocalMode ? createLocalDb() : createSupabaseDb(createClient(url, key))
