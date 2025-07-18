import {
  supabase,
  type Transaction,
  type TransactionDetail,
  type TransactionInsert,
  type TransactionUpdate,
  type TransactionWithDetails,
} from "@/lib/supabase";

// Helper function to handle Supabase errors
function handleSupabaseError(error: Error, message: string): never {
  console.error(`Supabase error ${message}:`, error);
  if (error.message.includes('relation "public.transactions" does not exist')) {
    throw new Error(
      "Database tables not found. Please run the setup script first."
    );
  }
  throw new Error(`${message}: ${error.message}`);
}

export class TransactionsAPI {
  static async getAll(): Promise<TransactionWithDetails[]> {
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
          *,
          users(username),
          transaction_details(*)
        `
      )
      .order("created_at", { ascending: false });

    if (transactionsError)
      handleSupabaseError(transactionsError, "Failed to fetch transactions");

    return (transactions || []).map((transaction) => ({
      ...transaction,
      details: transaction.transaction_details || [],
      user_name: transaction.users?.username || "Unknown",
    }));
  }

  static async getById(id: number): Promise<TransactionWithDetails | null> {
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select(
        `
          *,
          users(username),
          transaction_details(*)
        `
      )
      .eq("id", id)
      .single();

    if (transactionError) {
      if (transactionError.code === "PGRST116") {
        return null; // Transaction not found
      }
      handleSupabaseError(transactionError, "Failed to fetch transaction");
    }

    return {
      ...transaction,
      details: transaction.transaction_details || [],
      user_name: transaction.users?.username || "Unknown",
    };
  }

  static async create(transaction: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .insert([transaction])
      .select()
      .single();

    if (error) handleSupabaseError(error, "Failed to create transaction");
    return data;
  }

  static async update(
    id: number,
    updates: TransactionUpdate
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) handleSupabaseError(error, "Failed to update transaction");
    return data;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) handleSupabaseError(error, "Failed to delete transaction");
  }

  static async addItem(
    transactionId: number | null,
    productId: number,
    quantity: number
  ): Promise<TransactionDetail> {
    const { data, error } = await supabase.rpc("add_transaction_item", {
      p_transaction_id: transactionId,
      p_product_id: productId,
      p_quantity: quantity,
    });

    if (error) handleSupabaseError(error, "Failed to add item to transaction");

    if (!data || data.length === 0) {
      throw new Error("No data returned from add_transaction_item function");
    }

    return data[0] as unknown as TransactionDetail;
  }

  static async removeItem(detailId: number): Promise<void> {
    const { data: detail, error: getError } = await supabase
      .from("transaction_details")
      .select("transaction_id")
      .eq("id", detailId)
      .single();

    if (getError)
      handleSupabaseError(getError, "Failed to get transaction detail");

    const { error: deleteError } = await supabase
      .from("transaction_details")
      .delete()
      .eq("id", detailId);

    if (deleteError)
      handleSupabaseError(
        deleteError,
        "Failed to remove item from transaction"
      );

    await supabase.rpc("update_transaction_total", {
      p_transaction_id: detail.transaction_id,
    });
  }

  static async updateItemQuantity(
    detailId: number,
    quantity: number
  ): Promise<TransactionDetail> {
    if (quantity <= 0) {
      await this.removeItem(detailId);
      throw new Error("Quantity set to 0, item removed.");
    }

    const { data: detail, error: getError } = await supabase
      .from("transaction_details")
      .select("transaction_id")
      .eq("id", detailId)
      .single();

    if (getError)
      handleSupabaseError(getError, "Failed to get transaction detail");

    const { data, error } = await supabase
      .from("transaction_details")
      .update({ quantity })
      .eq("id", detailId)
      .select()
      .single();

    if (error) handleSupabaseError(error, "Failed to update transaction item");

    await supabase.rpc("update_transaction_total", {
      p_transaction_id: detail.transaction_id,
    });

    return data;
  }

  static async complete(id: number): Promise<boolean> {
    const { data, error } = await supabase.rpc("complete_transaction", {
      p_transaction_id: id,
    });

    if (error) handleSupabaseError(error, "Failed to complete transaction");

    return data;
  }

  static async getStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    todayRevenue: number;
    averageOrderValue: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    const { data: all, error: allError } = await supabase
      .from("transactions")
      .select("total_price");
    if (allError)
      handleSupabaseError(allError, "Failed to fetch all transactions");

    const { data: todayData, error: todayError } = await supabase
      .from("transactions")
      .select("total_price")
      .gte("created_at", `${today}T00:00:00Z`);
    if (todayError)
      handleSupabaseError(todayError, "Failed to fetch today's transactions");

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
  }

  static async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<TransactionWithDetails[]> {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
          *,
          users(username),
          transaction_details(*)
        `
      )
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (error)
      handleSupabaseError(error, "Failed to fetch transactions by date range");

    return (transactions || []).map((transaction) => ({
      ...transaction,
      details: transaction.transaction_details || [],
      user_name: transaction.users?.username || "Unknown",
    }));
  }
}
