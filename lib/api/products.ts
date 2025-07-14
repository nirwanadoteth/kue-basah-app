import {
  supabase,
  type Product,
  type ProductInsert,
  type ProductUpdate,
} from "@/lib/supabase";

// Helper function to handle Supabase errors
function handleSupabaseError(error: Error, message: string): never {
  console.error(`Supabase error ${message}:`, error);
  if (error.message.includes('relation "public.products" does not exist')) {
    throw new Error(
      "Database tables not found. Please run the setup script first."
    );
  }
  throw new Error(`${message}: ${error.message}`);
}

export class ProductsAPI {
  static async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error, "Failed to fetch products");
    return data || [];
  }

  static async getById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Product not found
      }
      handleSupabaseError(error, "Failed to fetch product");
    }
    return data;
  }

  static async create(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) handleSupabaseError(error, "Failed to create product");
    return data;
  }

  static async update(id: number, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) handleSupabaseError(error, "Failed to update product");
    return data;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) handleSupabaseError(error, "Failed to delete product");
  }

  static async getLowStock(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .filter("current_stock", "lte", "min_stock")
      .order("current_stock", { ascending: true });

    if (error) handleSupabaseError(error, "Failed to fetch low stock products");
    return data || [];
  }

  static async updateStock(
    id: number,
    quantity: number,
    type: "addition" | "reduction"
  ): Promise<Product> {
    const product = await this.getById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const newStock =
      type === "addition"
        ? product.current_stock + quantity
        : Math.max(0, product.current_stock - quantity);

    return this.update(id, { current_stock: newStock });
  }

  static async search(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error, "Failed to search products");
    return data || [];
  }

  static async getStats(): Promise<{
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
  }> {
    const { data, error } = await supabase
      .from("products")
      .select("current_stock, total_value, min_stock");

    if (error) handleSupabaseError(error, "Failed to fetch product stats");

    const products = data || [];

    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.current_stock, 0),
      totalValue: products.reduce((sum, p) => sum + p.total_value, 0),
      lowStockCount: products.filter((p) => p.current_stock <= p.min_stock)
        .length,
    };
  }
}

