import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  getSupabaseAnonKeySafe,
  getSupabaseUrlSafe,
  isSupabaseConfigured,
} from '@/lib/supabase-url'

export { isSupabaseConfigured }

function assertSupabaseServerConfig(): { url: string; anonKey: string } {
  const url = getSupabaseUrlSafe()
  const anonKey = getSupabaseAnonKeySafe()
  if (!url || !anonKey) {
    throw new Error(
      'SUPABASE_NOT_CONFIGURED: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel'
    )
  }
  return { url, anonKey }
}

export async function createClient() {
  const { url, anonKey } = assertSupabaseServerConfig()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createServiceClient() {
  const url = getSupabaseUrlSafe()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey || serviceKey.startsWith('your_')) {
    throw new Error(
      'SUPABASE_SERVICE_NOT_CONFIGURED: set SUPABASE_SERVICE_ROLE_KEY on Vercel'
    )
  }

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}
