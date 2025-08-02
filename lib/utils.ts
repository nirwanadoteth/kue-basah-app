import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getPathname() {
	return typeof window !== 'undefined' ? window.location.pathname : '';
}

/**
 * Combines multiple class name values into a single optimized Tailwind CSS class string.
 *
 * Accepts any number of class name inputs, merges them using `clsx`, and resolves Tailwind CSS conflicts with `twMerge`.
 *
 * @returns The merged class name string
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a localized date representation.
 *
 * Returns 'N/A' if the input is null, undefined, or not a string. Returns 'Invalid Date' if the input cannot be parsed as a valid date. Otherwise, returns the date formatted with day (2-digit), month (short), and year (numeric) according to the specified locale.
 *
 * @param dateString - The date string to format
 * @param locale - Optional locale identifier for formatting (default is 'id-ID')
 * @returns The formatted date string, or 'N/A'/'Invalid Date' for invalid input
 */
export function formatDate(
	dateString: string | null | undefined,
	locale = 'id-ID'
): string {
	if (!dateString || typeof dateString !== 'string') {
		return 'N/A';
	}

	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}

	return date.toLocaleDateString(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

/**
 * Formats a numeric amount as Indonesian Rupiah currency.
 *
 * Returns 'Rp 0' if the input is null, undefined, not a number, or NaN. Otherwise, formats the amount using the specified locale with no decimal fraction digits.
 *
 * @param amount - The numeric value to format as currency
 * @param locale - Optional locale string for formatting (default is 'id-ID')
 * @returns The formatted currency string
 */
export function formatCurrency(
	amount: number | null | undefined,
	locale = 'id-ID'
): string {
	if (
		typeof amount !== 'number' ||
		isNaN(amount) ||
		amount === null ||
		amount === undefined
	) {
		return 'Rp 0';
	}

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
	}).format(amount);
}

/**
 * Converts any value to a string, returning an empty string if the input is null or undefined.
 *
 * @param value - The value to convert to a string
 * @returns The string representation of the input, or an empty string if the input is null or undefined
 */
export function safeString(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value);
}

/**
 * Returns the current date as an ISO-formatted string in `YYYY-MM-DD` format.
 */
export function createDateString(): string {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

/**
 * Safely parses a value into an integer, returning a fallback if parsing fails.
 *
 * @param value - The value to parse as an integer
 * @param fallback - The value to return if parsing is unsuccessful (default is 0)
 * @returns The parsed integer, or the fallback if parsing fails
 */
export function safeParseInt(value: unknown, fallback = 0): number {
	if (value === null || value === undefined) {
		return fallback;
	}
	const parsed = Number.parseInt(String(value), 10);
	return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parses a value into a floating-point number, returning a fallback if parsing fails.
 *
 * @param value - The value to parse as a float
 * @param fallback - The value to return if parsing fails (default is 0)
 * @returns The parsed floating-point number, or the fallback if parsing is unsuccessful
 */
export function safeParseFloat(value: unknown, fallback = 0): number {
	if (value === null || value === undefined) {
		return fallback;
	}
	const parsed = Number.parseFloat(String(value));
	return isNaN(parsed) ? fallback : parsed;
}
