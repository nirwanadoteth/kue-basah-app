import { createClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/postgrest-js';
import type {
	Product,
	ProductInsert,
	ProductUpdate,
	Transaction,
	TransactionDetail,
	TransactionInsert,
	TransactionUpdate,
	TransactionWithDetails,
	DailyReport,
	AuthUser,
	User,
	UserInsert,
	UserUpdate,
	TransactionDetailInsert,
	TransactionDetailUpdate,
	DailyReportInsert,
	DailyReportUpdate,
	TransactionDetailWithProduct,
} from './types';

export type {
	Product,
	ProductInsert,
	ProductUpdate,
	Transaction,
	TransactionDetail,
	TransactionInsert,
	TransactionUpdate,
	TransactionWithDetails,
	DailyReport,
	AuthUser,
	User,
	UserInsert,
	UserUpdate,
	TransactionDetailInsert,
	TransactionDetailUpdate,
	DailyReportInsert,
	DailyReportUpdate,
	TransactionDetailWithProduct,
};

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
	console.error('❌ Missing Supabase environment variables');
	console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
	console.error(
		'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:',
		supabasePublishableKey ? '✓' : '✗'
	);
}

export const supabase = createClient(
	supabaseUrl || 'https://placeholder.supabase.co',
	supabasePublishableKey || 'placeholder-key',
	{
		auth: {
			persistSession: true,
			autoRefreshToken: true,
		},
	}
);

/**
 * Determines whether the given value is an object containing a string `message` property.
 *
 * @param error - The value to check
 * @returns True if `error` is an object with a string `message` property; otherwise, false
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: string }).message === 'string'
	);
}

// Test connection — aman untuk lingkungan yang mem-block fetch
export const testSupabaseConnection = async () => {
	// If env variables are not set or are placeholders, assume connection is not set up
	if (
		!supabaseUrl ||
		!supabasePublishableKey ||
		supabaseUrl.includes('placeholder') ||
		supabasePublishableKey.includes('placeholder')
	) {
		return false;
	}

	try {
		// Attempt a simple query to check connection and table existence
		const { error }: { error: PostgrestError | null } = await supabase
			.from('products')
			.select('id', { head: true, count: 'exact' });

		if (error) {
			console.warn(
				'Supabase connection check failed:',
				error.message || JSON.stringify(error)
			);
			return false;
		}

		return true;
	} catch (err: unknown) {
		// Catch network errors (e.g., fetch failed, CORS issues)
		console.warn(
			'Supabase connection test - network error:',
			isErrorWithMessage(err) ? err.message : JSON.stringify(err)
		);
		return false;
	}
};

// Check if tables exist
export const checkTablesExist = async () => {
	const tables = [
		'products',
		'users',
		'transactions',
		'transaction_details',
		'daily_reports',
	];
	let allTablesExist = true;

	for (const table of tables) {
		try {
			const { error }: { error: PostgrestError | null } = await supabase
				.from(table)
				.select('count', { count: 'exact', head: true });

			if (error) {
				console.warn(
					`Table '${table}' does not exist or is inaccessible:`,
					isErrorWithMessage(error)
						? error.message
						: JSON.stringify(error)
				);
				allTablesExist = false;
				// No need to continue checking if one table is missing
				break;
			}
		} catch (error: unknown) {
			console.warn(
				`Error checking table '${table}':`,
				isErrorWithMessage(error)
					? error.message
					: JSON.stringify(error)
			);
			allTablesExist = false;
			break;
		}
	}

	return {
		allTablesExist,
		needsSetup: !allTablesExist,
	};
};
