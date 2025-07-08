import { supabase, type Transaction, type TransactionInsert } from "@/lib/supabase"
import { ProductsAPI } from "./products"

export class TransactionsAPI {
  // Get all transactions
  static async getAll(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error fetching transactions:", error)
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in TransactionsAPI.getAll:", error)
      throw error
    }
  }

  // Get transactions by product ID
  static async getByProductId(productId: number): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error fetching product transactions:", error)
        throw new Error(`Failed to fetch product transactions: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in TransactionsAPI.getByProductId:", error)
      throw error
    }
  }

  // Create new transaction and update stock
  static async create(transaction: Omit<TransactionInsert, "product_name">): Promise<Transaction> {
    try {
      // Get product details
      const product = await ProductsAPI.getById(transaction.product_id)
      if (!product) {
        throw new Error("Product not found")
      }

      // Ensure transaction_date is properly formatted
      const transactionDate = transaction.transaction_date || new Date().toISOString().split("T")[0]

      // Try to use the stored function first
      const { data: functionResult, error: functionError } = await supabase.rpc(
        "create_transaction_with_stock_update",
        {
          p_product_id: transaction.product_id,
          p_product_name: product.name,
          p_type: transaction.type,
          p_quantity: transaction.quantity,
          p_notes: transaction.notes || "",
          p_transaction_date: transactionDate,
        },
      )

      if (functionError) {
        console.warn("Stored function not available, using manual transaction:", functionError)
        return this.createManual(transaction, product.name)
      }

      if (functionResult && Array.isArray(functionResult) && functionResult.length > 0) {
        return functionResult[0]
      }

      // Fallback to manual transaction
      return this.createManual(transaction, product.name)
    } catch (error) {
      console.error("Error in TransactionsAPI.create:", error)
      throw error
    }
  }

  // Manual transaction creation (fallback)
  private static async createManual(
    transaction: Omit<TransactionInsert, "product_name">,
    productName: string,
  ): Promise<Transaction> {
    try {
      // Update stock first
      await ProductsAPI.updateStock(transaction.product_id, transaction.quantity, transaction.type)

      // Ensure transaction_date is properly formatted
      const transactionDate = transaction.transaction_date || new Date().toISOString().split("T")[0]

      // Create transaction record
      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            ...transaction,
            product_name: productName,
            transaction_date: transactionDate,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Supabase error creating transaction:", error)

        if (error.message && error.message.includes('relation "public.transactions" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to create transaction: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in TransactionsAPI.createManual:", error)
      throw error
    }
  }

  // Get transactions by date range
  static async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date", { ascending: false })

      if (error) {
        console.error("Supabase error fetching transactions by date:", error)
        throw new Error(`Failed to fetch transactions by date: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in TransactionsAPI.getByDateRange:", error)
      throw error
    }
  }

  // Get transactions by type
  static async getByType(type: "addition" | "reduction"): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error fetching transactions by type:", error)
        throw new Error(`Failed to fetch transactions by type: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in TransactionsAPI.getByType:", error)
      throw error
    }
  }

  // Search transactions
  static async search(query: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`product_name.ilike.%${query}%,notes.ilike.%${query}%`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error searching transactions:", error)
        throw new Error(`Failed to search transactions: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in TransactionsAPI.search:", error)
      throw error
    }
  }

  // Get transaction statistics
  static async getStats(): Promise<{
    totalTransactions: number
    totalAdditions: number
    totalReductions: number
    todayTransactions: number
  }> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const [allTransactions, todayTransactions] = await Promise.all([
        this.getAll(),
        supabase.from("transactions").select("*").eq("transaction_date", today),
      ])

      const all = allTransactions || []
      const todayData = todayTransactions.data || []

      return {
        totalTransactions: all.length,
        totalAdditions: all.filter((t) => t.type === "addition").length,
        totalReductions: all.filter((t) => t.type === "reduction").length,
        todayTransactions: todayData.length,
      }
    } catch (error) {
      console.error("Error in TransactionsAPI.getStats:", error)
      throw error
    }
  }

  // Delete transaction (admin only)
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id)

      if (error) {
        console.error("Supabase error deleting transaction:", error)
        throw new Error(`Failed to delete transaction: ${error.message}`)
      }
    } catch (error) {
      console.error("Error in TransactionsAPI.delete:", error)
      throw error
    }
  }
}
