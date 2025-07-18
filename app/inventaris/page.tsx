"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/lib/stores/product-store";
import { AddProductModal } from "@/components/add-product-modal";
import { DeleteProductModal } from "@/components/delete-product-modal";
import { EditProductModal } from "@/components/edit-product-modal";
import { TableSkeleton } from "@/components/loading-skeleton";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Sparkles,
  RefreshCw,
  Minus,
} from "lucide-react";
import type { Product } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export default function InventoryManagement() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const { isLoading, error, updateStock, clearError, fetchProducts, products } =
    useProductStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, [fetchProducts]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handleUpdateStock = async (
    productId: number,
    type: "addition" | "reduction"
  ) => {
    await updateStock(productId, 1, type);
  };

  const handleRefresh = async () => {
    clearError();
    try {
      await fetchProducts();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <Package className="h-8 w-8 text-pink-500" />
            Manajemen Inventaris
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Kelola semua produk kue basah Anda
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari produk..."
              className="pl-10 w-64 border-pink-200 focus:border-pink-400 rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-4 bg-transparent"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <AddProductModal
            trigger={
              <Button className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cotton-candy-card rounded-2xl border-0 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">
              {filteredProducts.length}
            </div>
            <div className="text-sm text-gray-600">Total Produk</div>
          </div>
        </Card>
        <Card className="cotton-candy-card rounded-2xl border-0 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {filteredProducts.reduce(
                (sum, p) => sum + (p?.current_stock || 0),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Stok</div>
          </div>
        </Card>
        <Card className="cotton-candy-card rounded-2xl border-0 p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-500">
              {formatCurrency(
                filteredProducts.reduce(
                  (sum, p) => sum + (p?.total_value || 0),
                  0
                )
              )}
            </div>
            <div className="text-sm text-gray-600">Total Nilai</div>
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Produk
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Stok
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Harga
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Total Nilai
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      {searchTerm ? (
                        <div>
                          <p className="mb-4">
                            Tidak ada produk yang ditemukan untuk &quot;
                            {searchTerm}&quot;
                          </p>
                          <AddProductModal
                            trigger={
                              <Button className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Produk Baru
                              </Button>
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="mb-4">
                            Belum ada produk. Tambahkan produk pertama Anda!
                          </p>
                          <AddProductModal
                            trigger={
                              <Button className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Produk Pertama
                              </Button>
                            }
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => {
                    // Add safety check for item
                    if (!item || typeof item !== "object") {
                      return null;
                    }

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-pink-50 hover:bg-gradient-to-r hover:from-pink-25 hover:to-purple-25 transition-all duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {item.name || "Unknown Product"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Min: {item.min_stock || 0}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-lg ${
                                (item.current_stock || 0) <=
                                (item.min_stock || 0)
                                  ? "text-red-500"
                                  : (item.current_stock || 0) <=
                                    (item.min_stock || 0) * 1.5
                                  ? "text-yellow-500"
                                  : "text-green-500"
                              }`}
                            >
                              {item.current_stock || 0}
                            </span>
                            <span className="text-gray-400 text-sm">pcs</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {formatCurrency(item.price || 0)}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {formatCurrency(item.total_value || 0)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-3"
                              onClick={() =>
                                handleUpdateStock(item.id, "addition")
                              }
                              disabled={isLoading}
                              title="Tambah Stok"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="cotton-candy-button from-blue-400 to-cyan-400 rounded-full px-3"
                              onClick={() =>
                                handleUpdateStock(item.id, "reduction")
                              }
                              disabled={isLoading}
                              title="Kurangi Stok"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <EditProductModal
                              product={item}
                              trigger={
                                <Button
                                  size="sm"
                                  className="cotton-candy-button from-purple-400 to-indigo-400 rounded-full px-3"
                                  title="Edit Produk"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              }
                            />
                            <DeleteProductModal
                              productId={item.id}
                              productName={item.name}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-500 hover:bg-red-50 rounded-full px-3 bg-transparent"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
