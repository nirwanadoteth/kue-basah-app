"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ProductsAPI } from "@/lib/api/products"
import { TransactionsAPI } from "@/lib/api/transactions"
import { ReportsAPI } from "@/lib/api/reports"
import { CustomerTransactionsAPI } from "@/lib/api/customer-transactions"
import type { Product, Transaction, DailyReport, CustomerTransactionWithDetails } from "@/lib/supabase"
import { toast } from "sonner"

interface InventoryStore {
  // State
  products: Product[]
  transactions: Transaction[]
  customerTransactions: CustomerTransactionWithDetails[]
  dailyReports: DailyReport[]
  isLoading: boolean
  error: string | null
  needsSetup: boolean

  // Actions
  fetchProducts: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchCustomerTransactions: () => Promise<void>
  fetchReports: () => Promise<void>

  addProduct: (product: Omit<Product, "id" | "total_value" | "created_at" | "updated_at">) => Promise<void>
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: number) => Promise<void>

  updateStock: (productId: number, quantity: number, type: "addition" | "reduction", notes: string) => Promise<void>

  searchProducts: (query: string) => Promise<Product[]>
  searchTransactions: (query: string) => Promise<Transaction[]>
  searchCustomerTransactions: (query: string) => Promise<CustomerTransactionWithDetails[]>

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
      customerTransactions: [],
      dailyReports: [],
      isLoading: false,
      error: null,
      needsSetup: false,

      // Fetch data with better error handling
      fetchProducts: async () => {
        try {
          set({ isLoading: true, error: null, needsSetup: false })
          const products = await ProductsAPI.getAll()
          set({ products, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"

          // Check if it's a setup issue
          const isSetupError =
            errorMessage.includes("Database tables not found") ||
            errorMessage.includes('relation "public.products" does not exist')

          set({
            error: isSetupError ? "Database setup required" : errorMessage,
            isLoading: false,
            needsSetup: isSetupError,
          })

          console.error("Error fetching products:", error)

          if (!isSetupError) {
            toast.error(errorMessage)
          }

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

          // Check if it's a setup issue
          const isSetupError =
            errorMessage.includes("Database tables not found") ||
            errorMessage.includes('relation "public.transactions" does not exist')

          set({
            error: isSetupError ? "Database setup required" : errorMessage,
            isLoading: false,
            needsSetup: isSetupError,
          })

          console.error("Error fetching transactions:", error)

          if (!isSetupError) {
            toast.error(errorMessage)
          }

          throw error
        }
      },

      fetchCustomerTransactions: async () => {
        try {
          set({ isLoading: true, error: null, needsSetup: false })
          const customerTransactions = await CustomerTransactionsAPI.getAll()
          set({ customerTransactions, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch customer transactions"

          // Check if it's a setup issue
          const isSetupError =
            errorMessage.includes("Database tables not found") ||
            errorMessage.includes('relation "public.customer_transactions" does not exist')

          set({
            error: isSetupError ? "Database setup required" : errorMessage,
            isLoading: false,
            needsSetup: isSetupError,
          })

          console.error("Error fetching customer transactions:", error)

          if (!isSetupError) {
            toast.error(errorMessage)
          }

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

          // Check if it's a setup issue
          const isSetupError =
            errorMessage.includes("Database tables not found") ||
            errorMessage.includes('relation "public.daily_reports" does not exist')

          set({
            error: isSetupError ? "Database setup required" : errorMessage,
            isLoading: false,
            needsSetup: isSetupError,
          })

          console.error("Error fetching reports:", error)

          if (!isSetupError) {
            toast.error(errorMessage)
          }

          throw error
        }
      },

      // Product management
      addProduct: async (productData) => {
        try {
          set({ isLoading: true, error: null })

          // Validate required fields
          if (!productData.name || !productData.name.trim()) {
            throw new Error("Nama produk wajib diisi")
          }

          if (typeof productData.price !== "number" || productData.price <= 0) {
            throw new Error("Harga harus berupa angka yang valid dan lebih dari 0")
          }

          if (typeof productData.current_stock !== "number" || productData.current_stock < 0) {
            throw new Error("Stok awal harus berupa angka yang valid dan tidak negatif")
          }

          if (typeof productData.min_stock !== "number" || productData.min_stock < 0) {
            throw new Error("Stok minimum harus berupa angka yang valid dan tidak negatif")
          }

          const newProduct = await ProductsAPI.create({
            name: productData.name.trim(),
            price: productData.price,
            current_stock: productData.current_stock,
            min_stock: productData.min_stock,
          })

          set((state) => ({
            products: [...state.products, newProduct],
            isLoading: false,
          }))

          console.log("Product added successfully:", newProduct)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to add product"
          set({ error: errorMessage, isLoading: false })
          console.error("Error adding product:", error)
          throw error
        }
      },

      updateProduct: async (id, updates) => {
        try {
          set({ isLoading: true, error: null })

          // Validate updates
          if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
            throw new Error("Nama produk tidak boleh kosong")
          }

          if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price <= 0)) {
            throw new Error("Harga harus berupa angka yang valid dan lebih dari 0")
          }

          if (updates.min_stock !== undefined && (typeof updates.min_stock !== "number" || updates.min_stock < 0)) {
            throw new Error("Stok minimum harus berupa angka yang valid dan tidak negatif")
          }

          const updatedProduct = await ProductsAPI.update(id, updates)

          set((state) => ({
            products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
            isLoading: false,
          }))

          console.log("Product updated successfully:", updatedProduct)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update product"
          set({ error: errorMessage, isLoading: false })
          console.error("Error updating product:", error)
          throw error
        }
      },

      deleteProduct: async (id) => {
        try {
          set({ isLoading: true, error: null })
          const product = get().products.find((p) => p.id === id)

          await ProductsAPI.delete(id)

          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
            transactions: state.transactions.filter((t) => t.product_id !== id),
            isLoading: false,
          }))

          console.log("Product deleted successfully:", product?.name)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to delete product"
          set({ error: errorMessage, isLoading: false })
          console.error("Error deleting product:", error)
          throw error
        }
      },

      // Stock management
      updateStock: async (productId, quantity, type, notes) => {
        try {
          set({ isLoading: true, error: null })

          // Validate inputs
          if (!productId || isNaN(productId)) {
            throw new Error("ID produk tidak valid")
          }

          if (!quantity || isNaN(quantity) || quantity <= 0) {
            throw new Error("Jumlah harus berupa angka yang valid dan lebih dari 0")
          }

          // Check if product exists
          const currentProduct = get().products.find((p) => p.id === productId)
          if (!currentProduct) {
            throw new Error("Produk tidak ditemukan")
          }

          // Check if reducing stock would result in negative stock
          if (type === "reduction" && currentProduct.current_stock < quantity) {
            throw new Error(`Stok tidak mencukupi. Stok saat ini: ${currentProduct.current_stock}`)
          }

          // Create transaction (this will also update the stock)
          const newTransaction = await TransactionsAPI.create({
            product_id: productId,
            type,
            quantity,
            notes: notes || `${type === "addition" ? "Penambahan" : "Pengurangan"} stok`,
          })

          // Fetch updated product
          const updatedProduct = await ProductsAPI.getById(productId)

          if (updatedProduct) {
            set((state) => ({
              products: state.products.map((p) => (p.id === productId ? updatedProduct : p)),
              transactions: [newTransaction, ...state.transactions],
              isLoading: false,
            }))
          }

          console.log("Stock updated successfully:", { productId, quantity, type })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update stock"
          set({ error: errorMessage, isLoading: false })
          console.error("Error updating stock:", error)
          throw error
        }
      },

      // Search functions
      searchProducts: async (query) => {
        try {
          if (!query.trim()) {
            return get().products
          }
          return await ProductsAPI.search(query)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to search products"
          console.error("Error searching products:", error)
          toast.error(errorMessage)
          return []
        }
      },

      searchTransactions: async (query) => {
        try {
          if (!query.trim()) {
            return get().transactions
          }
          return await TransactionsAPI.search(query)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to search transactions"
          console.error("Error searching transactions:", error)
          toast.error(errorMessage)
          return []
        }
      },

      searchCustomerTransactions: async (query) => {
        try {
          if (!query.trim()) {
            return get().customerTransactions
          }
          return await CustomerTransactionsAPI.search(query)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to search customer transactions"
          console.error("Error searching customer transactions:", error)
          toast.error(errorMessage)
          return []
        }
      },

      // Getters
      getTotalStock: () => {
        const { products } = get()
        return products.reduce((total, product) => total + (product.current_stock || 0), 0)
      },

      getLowStockItems: () => {
        const { products } = get()
        return products.filter((product) => (product.current_stock || 0) <= (product.min_stock || 0)).length
      },

      getTotalValue: () => {
        const { products } = get()
        return products.reduce((total, product) => total + (product.total_value || 0), 0)
      },

      getStockAlerts: () => {
        const { products } = get()
        return products.filter((product) => (product.current_stock || 0) <= (product.min_stock || 0))
      },

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
        transactions: state.transactions,
        customerTransactions: state.customerTransactions,
      }),
    },
  ),
)
