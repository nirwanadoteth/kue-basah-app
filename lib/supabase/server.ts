import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates and returns a new Supabase server client instance configured for server-side rendering in a Next.js environment.
 *
 * Throws an error if required Supabase environment variables are missing.
 * Ensures a fresh client is created on each call, which is important for Fluid compute environments.
 *
 * @returns A Supabase server client instance configured with the current request's cookies
 */
export async function createClient() {
  const cookieStore = await cookies()

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
