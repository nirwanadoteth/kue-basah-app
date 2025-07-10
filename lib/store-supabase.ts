"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ProductsAPI } from "@/lib/api/products"
import { TransactionsAPI } from "@/lib/api/transactions"
import { ReportsAPI } from "@/lib/api/reports"
import type {
  Product,
  DailyReport,
  TransactionWithDetails,
  TransactionInsert,
  ProductInsert,
  ProductUpdate,
} from "@/lib/supabase"
import { toast } from "sonner"

interface InventoryStore {
  // State
  products: Product[]
  transactions: TransactionWithDetails[]
  dailyReports: DailyReport[]
  isLoading: boolean
  error: string | null
  needsSetup: boolean

  // Actions
  fetchProducts: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchReports: () => Promise<void>

  addProduct: (product: ProductInsert) => Promise<void>
  updateProduct: (id: number, updates: ProductUpdate) => Promise<void>
  deleteProduct: (id: number) => Promise<void>

  // Getters
  getTotalStock: () => number
  getLowStockItems: () => number
  getTotalValue: () => number
  getStockAlerts: () => Product[]

  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setNeedsSetup: (needsSetup: boolean) => void
  clearError: () => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      transactions: [],
      dailyReports: [],
      isLoading: false,
      error: null,
      needsSetup: false,

      // Fetch data
      fetchProducts: async () => {
        try {
          set({ isLoading: true, error: null, needsSetup: false })
          const products = await ProductsAPI.getAll()
          set({ products, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"
          const isSetupError = errorMessage.includes("Database tables not found") || errorMessage.includes('relation "public.products" does not exist')
          set({ error: isSetupError ? "Database setup required" : errorMessage, isLoading: false, needsSetup: isSetupError })
          if (!isSetupError) toast.error(errorMessage)
          throw error
        }
      },

      fetchTransactions: async () => {
        try {
          set({ isLoading: true, error: null, needsSetup: false })
          const transactions = await TransactionsAPI.getAll()
          set({ transactions, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch transactions"
          const isSetupError = errorMessage.includes("Database tables not found") || errorMessage.includes('relation "public.transactions" does not exist')
          set({ error: isSetupError ? "Database setup required" : errorMessage, isLoading: false, needsSetup: isSetupError })
          if (!isSetupError) toast.error(errorMessage)
          throw error
        }
      },

      fetchReports: async () => {
        try {
          set({ isLoading: true, error: null, needsSetup: false })
          const dailyReports = await ReportsAPI.getDailyReports()
          set({ dailyReports, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch reports"
          const isSetupError = errorMessage.includes("Database tables not found") || errorMessage.includes('relation "public.daily_reports" does not exist')
          set({ error: isSetupError ? "Database setup required" : errorMessage, isLoading: false, needsSetup: isSetupError })
          if (!isSetupError) toast.error(errorMessage)
          throw error
        }
      },

      // Product management
      addProduct: async (productData) => {
        try {
          set({ isLoading: true, error: null })
          const newProduct = await ProductsAPI.create(productData)
          set((state) => ({ products: [...state.products, newProduct], isLoading: false }))
          toast.success(`Produk "${newProduct.name}" berhasil ditambahkan.`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to add product"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      updateProduct: async (id, updates) => {
        try {
          set({ isLoading: true, error: null })
          const updatedProduct = await ProductsAPI.update(id, updates)
          set((state) => ({
            products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
            isLoading: false,
          }))
          toast.success(`Produk "${updatedProduct.name}" berhasil diperbarui.`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update product"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      deleteProduct: async (id) => {
        try {
          set({ isLoading: true, error: null })
          const product = get().products.find((p) => p.id === id)
          await ProductsAPI.delete(id)
          set((state) => ({ products: state.products.filter((p) => p.id !== id), isLoading: false }))
          toast.success(`Produk "${product?.name}" berhasil dihapus.`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to delete product"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      // Getters
      getTotalStock: () => get().products.reduce((total, product) => total + (product.current_stock || 0), 0),
      getLowStockItems: () => get().products.filter((p) => (p.current_stock || 0) <= (p.min_stock || 0)).length,
      getTotalValue: () => get().products.reduce((total, product) => total + (product.total_value || 0), 0),
      getStockAlerts: () => get().products.filter((p) => (p.current_stock || 0) <= (p.min_stock || 0)),

      // Utility
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setNeedsSetup: (needsSetup) => set({ needsSetup }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "inventory-storage",
      partialize: (state) => ({
        products: state.products,
        transactions: state.transactions, // Persist sales transactions
      }),
    },
  ),
)