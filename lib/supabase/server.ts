import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
)

export function createClient() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase environment variables not properly configured')
    // Return a mock client that won't work but won't crash
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          get() {
            return undefined
          },
        },
      },
    )
  }

  const cookieStore = cookies()

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Test server-side connection
export const testServerConnection = async () => {
  try {
    if (!isSupabaseConfigured) {
      return false
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .select('id', { head: true, count: 'exact' })

    if (error) {
      console.warn('Server Supabase connection check:', error.message)
      return false
    }

    return true
  } catch (err: unknown) {
    const error = err as Error
    console.warn('Server Supabase connection test failed:', error?.message)
    return false
  }
}
