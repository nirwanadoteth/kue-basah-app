import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates and returns a Supabase client configured for browser environments using public environment variables.
 *
 * @returns A Supabase client instance for browser-side operations
 */
export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
	);
}
