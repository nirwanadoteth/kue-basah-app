import {
  supabase,
  type CustomerTransaction,
  type TransactionDetail,
  type CustomerTransactionInsert,
  type CustomerTransactionUpdate,
  type CustomerTransactionWithDetails,
} from "@/lib/supabase"

export class CustomerTransactionsAPI {
  // Get all customer transactions with details
  static async getAll(): Promise<CustomerTransactionWithDetails[]> {
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from("customer_transactions")
        .select(`
          *,
          users!customer_transactions_user_id_fkey(full_name, username)
        `)
        .order("created_at", { ascending: false })

      if (transactionsError) {
        console.error("Supabase error fetching customer transactions:", transactionsError)
        throw new Error(`Failed to fetch customer transactions: ${transactionsError.message}`)
      }

      // Get transaction details for each transaction
      const transactionsWithDetails = await Promise.all(
        (transactions || []).map(async (transaction) => {
          const { data: details, error: detailsError } = await supabase
            .from("transaction_details")
            .select("*")
            .eq("transaction_id", transaction.id)
            .order("created_at", { ascending: true })

          if (detailsError) {
            console.error("Error fetching transaction details:", detailsError)
          }

          return {
            ...transaction,
            details: details || [],
            user_name: transaction.users?.full_name || transaction.users?.username || "Unknown",
          }
        }),
      )

      return transactionsWithDetails
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.getAll:", error)
      throw error
    }
  }

  // Get customer transaction by ID with details
  static async getById(id: number): Promise<CustomerTransactionWithDetails | null> {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from("customer_transactions")
        .select(`
          *,
          users!customer_transactions_user_id_fkey(full_name, username)
        `)
        .eq("id", id)
        .single()

      if (transactionError) {
        if (transactionError.code === "PGRST116") {
          return null // Transaction not found
        }
        console.error("Supabase error fetching customer transaction:", transactionError)
        throw new Error(`Failed to fetch customer transaction: ${transactionError.message}`)
      }

      // Get transaction details
      const { data: details, error: detailsError } = await supabase
        .from("transaction_details")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true })

      if (detailsError) {
        console.error("Error fetching transaction details:", detailsError)
      }

      return {
        ...transaction,
        details: details || [],
        user_name: transaction.users?.full_name || transaction.users?.username || "Unknown",
      }
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.getById:", error)
      throw error
    }
  }

  // Create new customer transaction
  static async create(transaction: CustomerTransactionInsert): Promise<CustomerTransaction> {
    try {
      const { data, error } = await supabase.from("customer_transactions").insert([transaction]).select().single()

      if (error) {
        console.error("Supabase error creating customer transaction:", error)
        throw new Error(`Failed to create customer transaction: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.create:", error)
      throw error
    }
  }

  // Update customer transaction
  static async update(id: number, updates: CustomerTransactionUpdate): Promise<CustomerTransaction> {
    try {
      const { data, error } = await supabase
        .from("customer_transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase error updating customer transaction:", error)
        throw new Error(`Failed to update customer transaction: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.update:", error)
      throw error
    }
  }

  // Delete customer transaction
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase.from("customer_transactions").delete().eq("id", id)

      if (error) {
        console.error("Supabase error deleting customer transaction:", error)
        throw new Error(`Failed to delete customer transaction: ${error.message}`)
      }
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.delete:", error)
      throw error
    }
  }

  // Add item to transaction
  static async addItem(transactionId: number, productId: number, quantity: number): Promise<TransactionDetail> {
    try {
      const { data, error } = await supabase.rpc("add_transaction_item", {
        p_transaction_id: transactionId,
        p_product_id: productId,
        p_quantity: quantity,
      })

      if (error) {
        console.error("Supabase error adding transaction item:", error)
        throw new Error(`Failed to add item to transaction: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from add_transaction_item function")
      }

      return data[0]
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.addItem:", error)
      throw error
    }
  }

  // Remove item from transaction
  static async removeItem(detailId: number): Promise<void> {
    try {
      // Get transaction ID before deleting
      const { data: detail, error: getError } = await supabase
        .from("transaction_details")
        .select("transaction_id")
        .eq("id", detailId)
        .single()

      if (getError) {
        throw new Error(`Failed to get transaction detail: ${getError.message}`)
      }

      // Delete the item
      const { error: deleteError } = await supabase.from("transaction_details").delete().eq("id", detailId)

      if (deleteError) {
        console.error("Supabase error removing transaction item:", deleteError)
        throw new Error(`Failed to remove item from transaction: ${deleteError.message}`)
      }

      // Update transaction total
      await supabase.rpc("update_transaction_total", {
        p_transaction_id: detail.transaction_id,
      })
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.removeItem:", error)
      throw error
    }
  }

  // Update item quantity
  static async updateItemQuantity(detailId: number, quantity: number): Promise<TransactionDetail> {
    try {
      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0")
      }

      // Get transaction ID before updating
      const { data: detail, error: getError } = await supabase
        .from("transaction_details")
        .select("transaction_id")
        .eq("id", detailId)
        .single()

      if (getError) {
        throw new Error(`Failed to get transaction detail: ${getError.message}`)
      }

      // Update the quantity
      const { data, error } = await supabase
        .from("transaction_details")
        .update({ quantity })
        .eq("id", detailId)
        .select()
        .single()

      if (error) {
        console.error("Supabase error updating transaction item:", error)
        throw new Error(`Failed to update item quantity: ${error.message}`)
      }

      // Update transaction total
      await supabase.rpc("update_transaction_total", {
        p_transaction_id: detail.transaction_id,
      })

      return data
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.updateItemQuantity:", error)
      throw error
    }
  }

  // Complete transaction (reduce stock)
  static async complete(id: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("complete_customer_transaction", {
        p_transaction_id: id,
      })

      if (error) {
        console.error("Supabase error completing transaction:", error)
        throw new Error(`Failed to complete transaction: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.complete:", error)
      throw error
    }
  }

  // Get transaction statistics
  static async getStats(): Promise<{
    totalTransactions: number
    totalRevenue: number
    todayRevenue: number
    averageOrderValue: number
  }> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const [allTransactions, todayTransactions] = await Promise.all([
        supabase.from("customer_transactions").select("total_price"),
        supabase.from("customer_transactions").select("total_price").gte("created_at", today),
      ])

      const all = allTransactions.data || []
      const todayData = todayTransactions.data || []

      const totalRevenue = all.reduce((sum, t) => sum + (t.total_price || 0), 0)
      const todayRevenue = todayData.reduce((sum, t) => sum + (t.total_price || 0), 0)

      return {
        totalTransactions: all.length,
        totalRevenue,
        todayRevenue,
        averageOrderValue: all.length > 0 ? totalRevenue / all.length : 0,
      }
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.getStats:", error)
      throw error
    }
  }

  // Search transactions by date range
  static async getByDateRange(startDate: string, endDate: string): Promise<CustomerTransactionWithDetails[]> {
    try {
      const { data: transactions, error } = await supabase
        .from("customer_transactions")
        .select(`
          *,
          users!customer_transactions_user_id_fkey(full_name, username)
        `)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error fetching transactions by date range:", error)
        throw new Error(`Failed to fetch transactions by date range: ${error.message}`)
      }

      // Get transaction details for each transaction
      const transactionsWithDetails = await Promise.all(
        (transactions || []).map(async (transaction) => {
          const { data: details } = await supabase
            .from("transaction_details")
            .select("*")
            .eq("transaction_id", transaction.id)
            .order("created_at", { ascending: true })

          return {
            ...transaction,
            details: details || [],
            user_name: transaction.users?.full_name || transaction.users?.username || "Unknown",
          }
        }),
      )

      return transactionsWithDetails
    } catch (error) {
      console.error("Error in CustomerTransactionsAPI.getByDateRange:", error)
      throw error
    }
  }
}
