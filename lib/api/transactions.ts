import {
  supabase,
  type Transaction,
  type TransactionDetail,
  type TransactionInsert,
  type TransactionUpdate,
  type TransactionWithDetails,
} from "@/lib/supabase";

export class TransactionsAPI {
  // Get all transactions with details
  static async getAll(): Promise<TransactionWithDetails[]> {
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(
          `
          *,
          users(username)
        `
        )
        .order("created_at", { ascending: false });

      if (transactionsError) {
        console.error(
          "Supabase error fetching transactions:",
          transactionsError
        );
        throw new Error(
          `Failed to fetch transactions: ${transactionsError.message}`
        );
      }

      // Get transaction details for each transaction
      const transactionsWithDetails = await Promise.all(
        (transactions || []).map(async (transaction) => {
          const { data: details, error: detailsError } = await supabase
            .from("transaction_details")
            .select("*")
            .eq("transaction_id", transaction.id)
            .order("created_at", { ascending: true });

          if (detailsError) {
            console.error("Error fetching transaction details:", detailsError);
          }

          return {
            ...transaction,
            details: details || [],
            user_name: transaction.users?.username || "Unknown",
          };
        })
      );

      return transactionsWithDetails;
    } catch (error) {
      console.error("Error in TransactionsAPI.getAll:", error);
      throw error;
    }
  }

  // Get transaction by ID with details
  static async getById(id: number): Promise<TransactionWithDetails | null> {
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .select(
          `
          *,
          users(username)
        `
        )
        .eq("id", id)
        .single();

      if (transactionError) {
        if (transactionError.code === "PGRST116") {
          return null; // Transaction not found
        }
        console.error("Supabase error fetching transaction:", transactionError);
        throw new Error(
          `Failed to fetch transaction: ${transactionError.message}`
        );
      }

      // Get transaction details
      const { data: details, error: detailsError } = await supabase
        .from("transaction_details")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });

      if (detailsError) {
        console.error("Error fetching transaction details:", detailsError);
      }

      return {
        ...transaction,
        details: details || [],
        user_name: transaction.users?.username || "Unknown",
      };
    } catch (error) {
      console.error("Error in TransactionsAPI.getById:", error);
      throw error;
    }
  }

  // Create new transaction
  static async create(transaction: TransactionInsert): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([transaction])
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating transaction:", error);
        throw new Error(`Failed to create transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in TransactionsAPI.create:", error);
      throw error;
    }
  }

  // Update transaction
  static async update(
    id: number,
    updates: TransactionUpdate
  ): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating transaction:", error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in TransactionsAPI.update:", error);
      throw error;
    }
  }

  // Delete transaction
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase error deleting transaction:", error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in TransactionsAPI.delete:", error);
      throw error;
    }
  }

  // Add item to transaction
  static async addItem(
    transactionId: number,
    productId: number,
    quantity: number
  ): Promise<TransactionDetail> {
    try {
      const { data, error } = await supabase.rpc("add_transaction_item", {
        p_transaction_id: transactionId,
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Supabase error adding transaction item:", error);
        throw new Error(`Failed to add item to transaction: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from add_transaction_item function");
      }

      // The RPC function returns a record, which we cast to TransactionDetail
      return data[0] as unknown as TransactionDetail;
    } catch (error) {
      console.error("Error in TransactionsAPI.addItem:", error);
      throw error;
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
        .single();

      if (getError) {
        throw new Error(
          `Failed to get transaction detail: ${getError.message}`
        );
      }

      // Delete the item
      const { error: deleteError } = await supabase
        .from("transaction_details")
        .delete()
        .eq("id", detailId);

      if (deleteError) {
        console.error("Supabase error removing transaction item:", deleteError);
        throw new Error(
          `Failed to remove item from transaction: ${deleteError.message}`
        );
      }

      // Update transaction total
      await supabase.rpc("update_transaction_total", {
        p_transaction_id: detail.transaction_id,
      });
    } catch (error) {
      console.error("Error in TransactionsAPI.removeItem:", error);
      throw error;
    }
  }

  // Update item quantity
  static async updateItemQuantity(
    detailId: number,
    quantity: number
  ): Promise<TransactionDetail> {
    try {
      if (quantity <= 0) {
        await this.removeItem(detailId);
        throw new Error("Quantity set to 0, item removed.");
      }

      // Get transaction ID before updating
      const { data: detail, error: getError } = await supabase
        .from("transaction_details")
        .select("transaction_id")
        .eq("id", detailId)
        .single();

      if (getError) {
        throw new Error(
          `Failed to get transaction detail: ${getError.message}`
        );
      }

      // Update the quantity
      const { data, error } = await supabase
        .from("transaction_details")
        .update({ quantity })
        .eq("id", detailId)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating transaction item:", error);
        throw new Error(`Failed to update item quantity: ${error.message}`);
      }

      // Update transaction total
      await supabase.rpc("update_transaction_total", {
        p_transaction_id: detail.transaction_id,
      });

      return data;
    } catch (error) {
      console.error("Error in TransactionsAPI.updateItemQuantity:", error);
      throw error;
    }
  }

  // Complete transaction (reduce stock)
  static async complete(id: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("complete_transaction", {
        p_transaction_id: id,
      });

      if (error) {
        console.error("Supabase error completing transaction:", error);
        throw new Error(`Failed to complete transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in TransactionsAPI.complete:", error);
      throw error;
    }
  }

  // Get transaction statistics
  static async getStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    todayRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: all, error: allError } = await supabase
        .from("transactions")
        .select("total_price");
      if (allError)
        throw new Error(
          `Failed to fetch all transactions: ${allError.message}`
        );

      const { data: todayData, error: todayError } = await supabase
        .from("transactions")
        .select("total_price")
        .gte("created_at", `${today}T00:00:00Z`);
      if (todayError)
        throw new Error(
          `Failed to fetch today's transactions: ${todayError.message}`
        );

      const totalRevenue = (all || []).reduce(
        (sum, t) => sum + (t.total_price || 0),
        0
      );
      const todayRevenue = (todayData || []).reduce(
        (sum, t) => sum + (t.total_price || 0),
        0
      );
      const totalTransactions = (all || []).length;

      return {
        totalTransactions,
        totalRevenue,
        todayRevenue,
        averageOrderValue:
          totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      };
    } catch (error) {
      console.error("Error in TransactionsAPI.getStats:", error);
      throw error;
    }
  }

  // Search transactions by date range
  static async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<TransactionWithDetails[]> {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          users(username)
        `
        )
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Supabase error fetching transactions by date range:",
          error
        );
        throw new Error(
          `Failed to fetch transactions by date range: ${error.message}`
        );
      }

      // Get transaction details for each transaction
      const transactionsWithDetails = await Promise.all(
        (transactions || []).map(async (transaction) => {
          const { data: details } = await supabase
            .from("transaction_details")
            .select("*")
            .eq("transaction_id", transaction.id)
            .order("created_at", { ascending: true });

          return {
            ...transaction,
            details: details || [],
            user_name: transaction.users?.username || "Unknown",
          };
        })
      );

      return transactionsWithDetails;
    } catch (error) {
      console.error("Error in TransactionsAPI.getByDateRange:", error);
      throw error;
    }
  }
}
