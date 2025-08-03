import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe date formatting utility with better error handling
export function formatDate(
  dateString: string | null | undefined,
  locale = 'id-ID',
): string {
  if (!dateString || typeof dateString !== 'string') {
    return 'N/A'
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Safe currency formatting utility
export function formatCurrency(
  amount: number | null | undefined,
  locale = 'id-ID',
): string {
  if (
    typeof amount !== 'number' ||
    isNaN(amount) ||
    amount === null ||
    amount === undefined
  ) {
    return 'Rp 0'
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Safe string operations
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

// Safe date string creation
export function createDateString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

// Safe number parsing
export function safeParseInt(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback
  }
  const parsed = Number.parseInt(String(value), 10)
  return isNaN(parsed) ? fallback : parsed
}

// Safe number parsing for floats
export function safeParseFloat(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback
  }
  const parsed = Number.parseFloat(String(value))
  return isNaN(parsed) ? fallback : parsed
}
