import { supabase, type Product, type ProductInsert, type ProductUpdate } from "@/lib/supabase"

export class ProductsAPI {
  // Get all products
  static async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Supabase error fetching products:", error)

        // Handle specific error for missing table
        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to fetch products: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in ProductsAPI.getAll:", error)
      throw error
    }
  }

  // Get product by ID
  static async getById(id: number): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // Product not found
        }

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        console.error("Supabase error fetching product:", error)
        throw new Error(`Failed to fetch product: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in ProductsAPI.getById:", error)
      throw error
    }
  }

  // Create new product
  static async create(product: ProductInsert): Promise<Product> {
    try {
      const { data, error } = await supabase.from("products").insert([product]).select().single()

      if (error) {
        console.error("Supabase error creating product:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to create product: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in ProductsAPI.create:", error)
      throw error
    }
  }

  // Update product
  static async update(id: number, updates: ProductUpdate): Promise<Product> {
    try {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("Supabase error updating product:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to update product: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in ProductsAPI.update:", error)
      throw error
    }
  }

  // Delete product
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        console.error("Supabase error deleting product:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to delete product: ${error.message}`)
      }
    } catch (error) {
      console.error("Error in ProductsAPI.delete:", error)
      throw error
    }
  }

  // Get low stock products
  static async getLowStock(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .filter("current_stock", "lte", "min_stock")
        .order("current_stock", { ascending: true })

      if (error) {
        console.error("Supabase error fetching low stock products:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to fetch low stock products: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in ProductsAPI.getLowStock:", error)
      throw error
    }
  }

  // Update stock
  static async updateStock(id: number, quantity: number, type: "addition" | "reduction"): Promise<Product> {
    try {
      // First get current stock
      const product = await this.getById(id)
      if (!product) {
        throw new Error("Product not found")
      }

      const newStock =
        type === "addition" ? product.current_stock + quantity : Math.max(0, product.current_stock - quantity)

      return this.update(id, { current_stock: newStock })
    } catch (error) {
      console.error("Error in ProductsAPI.updateStock:", error)
      throw error
    }
  }

  // Search products
  static async search(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true })

      if (error) {
        console.error("Supabase error searching products:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to search products: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in ProductsAPI.search:", error)
      throw error
    }
  }

  // Get statistics
  static async getStats(): Promise<{
    totalProducts: number
    totalStock: number
    totalValue: number
    lowStockCount: number
  }> {
    try {
      const { data, error } = await supabase.from("products").select("current_stock, total_value, min_stock")

      if (error) {
        console.error("Supabase error fetching product stats:", error)

        if (error.message.includes('relation "public.products" does not exist')) {
          throw new Error("Database tables not found. Please run the setup script first.")
        }

        throw new Error(`Failed to fetch product stats: ${error.message}`)
      }

      const products = data || []

      return {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + p.current_stock, 0),
        totalValue: products.reduce((sum, p) => sum + p.total_value, 0),
        lowStockCount: products.filter((p) => p.current_stock <= p.min_stock).length,
      }
    } catch (error) {
      console.error("Error in ProductsAPI.getStats:", error)
      throw error
    }
  }
}
