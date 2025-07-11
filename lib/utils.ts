import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe date formatting utility with better error handling
export function formatDate(
  dateString: string | null | undefined,
  locale = "id-ID"
): string {
  try {
    // Handle null, undefined, or empty string
    if (!dateString || typeof dateString !== "string") {
      return "N/A";
    }

    // Ensure we have a valid string before any operations
    const cleanDateString = String(dateString).trim();
    if (!cleanDateString || cleanDateString.length < 8) {
      return cleanDateString || "N/A";
    }

    const date = new Date(cleanDateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "N/A";
  }
}

// Safe currency formatting utility
export function formatCurrency(
  amount: number | null | undefined,
  locale = "id-ID"
): string {
  try {
    // Handle null, undefined, or invalid numbers
    if (
      typeof amount !== "number" ||
      isNaN(amount) ||
      amount === null ||
      amount === undefined
    ) {
      return "Rp 0";
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `Rp ${(amount || 0).toLocaleString()}`;
  }
}

// Safe string operations
export function safeString(value: any): string {
  try {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  } catch (error) {
    console.error("String conversion error:", error);
    return "";
  }
}

// Safe date string creation
export function createDateString(): string {
  try {
    const now = new Date();
    const isoString = now.toISOString();

    // Safely split the ISO string
    if (typeof isoString === "string" && isoString.includes("T")) {
      return isoString.split("T")[0];
    }

    // Fallback: manually format the date
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Date creation error:", error);
    return "2025-01-02"; // fallback date
  }
}

// Safe number parsing
export function safeParseInt(value: any, fallback = 0): number {
  try {
    if (value === null || value === undefined) {
      return fallback;
    }
    const parsed = Number.parseInt(String(value), 10);
    return isNaN(parsed) ? fallback : parsed;
  } catch (error) {
    console.error("Number parsing error:", error);
    return fallback;
  }
}

// Safe number parsing for floats
export function safeParseFloat(value: any, fallback = 0): number {
  try {
    if (value === null || value === undefined) {
      return fallback;
    }
    const parsed = Number.parseFloat(String(value));
    return isNaN(parsed) ? fallback : parsed;
  } catch (error) {
    console.error("Float parsing error:", error);
    return fallback;
  }
}
