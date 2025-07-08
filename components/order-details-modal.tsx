"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CustomerTransactionsAPI } from "@/lib/api/customer-transactions"
import { useInventoryStore } from "@/lib/store-supabase"
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle, Package } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { CustomerTransactionWithDetails } from "@/lib/supabase"

interface OrderDetailsModalProps {
  trigger: React.ReactNode
  orderId: number
  onOrderUpdated?: () => void
}

export function OrderDetailsModal({ trigger, orderId, onOrderUpdated }: OrderDetailsModalProps) {
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<CustomerTransactionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")

  const { products, fetchProducts } = useInventoryStore()

  useEffect(() => {
    if (open) {
      loadOrder()
      fetchProducts()
    }
  }, [open, orderId, fetchProducts])

  const loadOrder = async () => {
    try {
      setIsLoading(true)
      const orderData = await CustomerTransactionsAPI.getById(orderId)
      setOrder(orderData)
    } catch (error) {
      console.error("Error loading order:", error)
      toast.error("Gagal memuat detail pesanan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedProductId || !quantity) {
      toast.error("Pilih produk dan masukkan jumlah")
      return
    }

    const qty = Number.parseInt(quantity)
    if (qty <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }

    try {
      setIsLoading(true)
      await CustomerTransactionsAPI.addItem(orderId, Number.parseInt(selectedProductId), qty)
      await loadOrder()
      setSelectedProductId("")
      setQuantity("1")
      toast.success("Item berhasil ditambahkan")
      onOrderUpdated?.()
    } catch (error) {
      console.error("Error adding item:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan item"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = async (detailId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }

    try {
      setIsLoading(true)
      await CustomerTransactionsAPI.updateItemQuantity(detailId, newQuantity)
      await loadOrder()
      toast.success("Jumlah berhasil diperbarui")
      onOrderUpdated?.()
    } catch (error) {
      console.error("Error updating quantity:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui jumlah"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async (detailId: number, productName: string) => {
    if (!window.confirm(`Hapus ${productName} dari pesanan?`)) {
      return
    }

    try {
      setIsLoading(true)
      await CustomerTransactionsAPI.removeItem(detailId)
      await loadOrder()
      toast.success("Item berhasil dihapus")
      onOrderUpdated?.()
    } catch (error) {
      console.error("Error removing item:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus item"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!order || order.details.length === 0) {
      toast.error("Pesanan harus memiliki minimal 1 item")
      return
    }

    if (!window.confirm("Selesaikan pesanan ini? Stok akan dikurangi dan pesanan tidak dapat diubah lagi.")) {
      return
    }

    try {
      setIsLoading(true)
      await CustomerTransactionsAPI.complete(orderId)
      await loadOrder()
      toast.success("Pesanan berhasil diselesaikan!")
      onOrderUpdated?.()
    } catch (error) {
      console.error("Error completing order:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menyelesaikan pesanan"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Selesai</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Dibatalkan</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  const availableProducts = products.filter(
    (product) => !order?.details.some((detail) => detail.product_id === product.id),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl cotton-candy-card border-pink-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            Detail Pesanan #{orderId}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !order ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pelanggan</p>
                <p className="font-semibold">{order.customer_name || "Tidak ada nama"}</p>
                {order.customer_phone && <p className="text-sm text-gray-600">{order.customer_phone}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-600">Admin</p>
                <p className="font-semibold">{order.user_name}</p>
                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(order.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(order.total_price)}</p>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Catatan</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Add Item (only for pending orders) */}
            {order.status === "pending" && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">Tambah Item</h4>
                <div className="flex gap-3">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {formatCurrency(product.price)} (Stok: {product.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Jumlah"
                    className="w-24"
                  />
                  <Button
                    onClick={handleAddItem}
                    disabled={isLoading || !selectedProductId}
                    className="cotton-candy-button from-blue-400 to-cyan-400"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan</h4>
              {order.details.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada item dalam pesanan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {order.details.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex items-center justify-between p-3 bg-white border border-pink-100 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{detail.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(detail.product_price)} × {detail.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">{formatCurrency(detail.subtotal)}</span>
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(detail.id, detail.quantity - 1)}
                              disabled={isLoading || detail.quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{detail.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(detail.id, detail.quantity + 1)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveItem(detail.id, detail.product_name)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0 border-red-200 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-pink-200 hover:bg-pink-50"
              >
                Tutup
              </Button>
              {order.status === "pending" && order.details.length > 0 && (
                <Button
                  onClick={handleCompleteOrder}
                  disabled={isLoading}
                  className="flex-1 cotton-candy-button from-green-400 to-emerald-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Memproses..." : "Selesaikan Pesanan"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-500">
            <p>Gagal memuat detail pesanan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
