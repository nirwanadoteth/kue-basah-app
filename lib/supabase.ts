import { createClient } from "@supabase/supabase-js";

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓" : "✗");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Test connection — aman untuk lingkungan yang mem-block fetch
export const testSupabaseConnection = async () => {
  try {
    // Jika variabel env belum diset atau placeholder → langsung gagal diam-diam
    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("placeholder") ||
      supabaseAnonKey.includes("placeholder")
    ) {
      return false;
    }

    // Supabase query HEAD
    const { error } = await supabase
      .from("products")
      .select("id", { head: true, count: "exact" });

    // Bila ada error (termasuk TypeError: Failed to fetch) anggap koneksi gagal
    if (error) {
      console.warn("Supabase connection check:", error.message ?? error);
      return false;
    }

    return true;
  } catch (err: any) {
    // Tangani error jaringan (fetch gagal, CORS, dll.)
    console.warn(
      "Supabase connection test – network error:",
      err?.message ?? err
    );
    return false;
  }
};

// Check if tables exist
export const checkTablesExist = async () => {
  const tables = [
    "products",
    "users",
    "transactions",
    "transaction_details",
    "daily_reports",
  ];
  const results = [];
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("count", { count: "exact", head: true });

      if (error) {
        results.push({ table, exists: false, error: error.message });
        allTablesExist = false;
      } else {
        results.push({ table, exists: true });
      }
    } catch (error) {
      results.push({
        table,
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      allTablesExist = false;
    }
  }

  return {
    allTablesExist,
    needsSetup: !allTablesExist,
    results,
  };
};

// Types matching the database schema

// Products table
export interface Product {
  id: number;
  name: string;
  price: number;
  current_stock: number;
  min_stock: number;
  total_value: number; // Generated column: current_stock * price
  created_at: string;
  updated_at: string;
}

// Users table
export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Transactions table (previously customer_transactions)
export interface Transaction {
  id: number;
  user_id: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  users?: { username?: string }; // For joins
}

// Transaction Details table
export interface TransactionDetail {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number; // Generated column: product_price * quantity
  created_at: string;
}

// Daily reports table
export interface DailyReport {
  id: number;
  report_date: string; // DATE type, default: CURRENT_DATE
  total_stock: number;
  total_sales: number;
  total_value: number;
  low_stock_items: number;
  created_at: string;
}

// Insert/Update types
export type ProductInsert = Omit<
  Product,
  "id" | "total_value" | "created_at" | "updated_at"
>;
export type ProductUpdate = Partial<ProductInsert>;

export type UserInsert = Omit<
  User,
  "id" | "created_at" | "updated_at" | "last_login"
>;
export type UserUpdate = Partial<
  Omit<User, "id" | "created_at" | "updated_at">
>;

export type TransactionInsert = Omit<
  Transaction,
  "id" | "total_price" | "created_at" | "updated_at" | "users"
>;
export type TransactionUpdate = Partial<
  Omit<Transaction, "id" | "created_at" | "updated_at" | "users">
>;

export type TransactionDetailInsert = Omit<
  TransactionDetail,
  "id" | "subtotal" | "created_at"
>;
export type TransactionDetailUpdate = Partial<
  Omit<TransactionDetail, "id" | "transaction_id" | "subtotal" | "created_at">
>;

export type DailyReportInsert = Omit<DailyReport, "id" | "created_at">;
export type DailyReportUpdate = Partial<Omit<DailyReport, "id" | "created_at">>;

// Authentication response type (from authenticate_user function)
export interface AuthUser {
  user_id: number;
  username: string;
}

// Transaction with details (for display)
export interface TransactionWithDetails extends Transaction {
  details: TransactionDetail[];
}

// Transaction detail with product info
export interface TransactionDetailWithProduct extends TransactionDetail {
  product?: Product;
}
