// Types matching the database schema

// Products table
export interface Product {
  id: number
  name: string
  price: number
  current_stock: number
  min_stock: number
  total_value: number // Generated column: current_stock * price
  created_at: string
  updated_at: string
}

// Users table
export interface User {
  id: number
  username: string
  password_hash: string
  created_at: string
  updated_at: string
  last_login: string | null
}

// Transactions table (previously customer_transactions)
export interface Transaction {
  id: number
  user_id: number
  total_price: number
  created_at: string
  updated_at: string
  users?: { username?: string } // For joins
}

// Transaction Details table
export interface TransactionDetail {
  id: number
  transaction_id: number
  product_id: number
  product_name: string
  product_price: number
  quantity: number
  subtotal: number // Generated column: product_price * quantity
  created_at: string
}

// Transaction item (for transaction_details relation)
export interface TransactionItem {
  product_name: string
  quantity: number
  product_price: number
}

// Daily reports table
export interface DailyReport {
  id: number
  report_date: string // DATE type, default: CURRENT_DATE
  total_stock: number
  total_sales: number
  total_value: number
  low_stock_items: number
  created_at: string
}

// Weekly reports data
export interface WeeklyReportData {
  weeklyData: Array<{
    week: string
    totalSales: number
    totalValue: number
    transactionCount: number
  }>
  weeklyProductTrend: Array<{
    name: string
    week1: number
    week2: number
    week3: number
    week4: number
  }>
}

// Monthly reports data
export interface MonthlyReportData {
  monthlyData: Array<{
    month: string
    totalSales: number
    totalValue: number
    transactionCount: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    profit: number
  }>
  topProducts: Array<{
    name: string
    totalSold: number
    revenue: number
  }>
}

// Insert/Update types
export type ProductInsert = Omit<
  Product,
  'id' | 'total_value' | 'created_at' | 'updated_at'
>
export type ProductUpdate = Partial<ProductInsert>

export type UserInsert = Omit<
  User,
  'id' | 'created_at' | 'updated_at' | 'last_login'
>
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>

export type TransactionInsert = Omit<
  Transaction,
  'id' | 'total_price' | 'created_at' | 'updated_at' | 'users'
>
export type TransactionUpdate = Partial<
  Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'users'>
>

export type TransactionDetailInsert = Omit<
  TransactionDetail,
  'id' | 'subtotal' | 'created_at'
>
export type TransactionDetailUpdate = Partial<
  Omit<TransactionDetail, 'id' | 'transaction_id' | 'subtotal' | 'created_at'>
>

export type DailyReportInsert = Omit<DailyReport, 'id' | 'created_at'>
export type DailyReportUpdate = Partial<Omit<DailyReport, 'id' | 'created_at'>>

// Authentication response type (from authenticate_user function)
export interface AuthUser {
  user_id: number
  username: string
}

// Transaction with details (for display)
export interface TransactionWithDetails extends Transaction {
  details: TransactionDetail[]
}

// Transaction detail with product info
export interface TransactionDetailWithProduct extends TransactionDetail {
  product?: Product
}
