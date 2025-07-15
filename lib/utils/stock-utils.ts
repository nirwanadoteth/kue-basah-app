import type { Product } from "@/lib/supabase";

export function getStockColorClass(product: Product): string {
  if (!product) return "";

  const currentStock = product.current_stock || 0;
  const minStock = product.min_stock || 0;

  if (currentStock <= minStock) {
    return "text-red-500";
  } else if (currentStock <= minStock * 1.5) {
    return "text-yellow-500";
  } else {
    return "text-green-500";
  }
}
