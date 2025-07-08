"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { CustomerTransactionsAPI } from "@/lib/api/customer-transactions"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface CreateOrderModalProps {
  trigger: React.ReactNode
  onOrderCreated: (orderId: number) => void
}

export function CreateOrderModal({ trigger, onOrderCreated }: CreateOrderModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    notes: "",
  })

  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Anda harus login untuk membuat pesanan")
      return
    }

    if (!formData.customerName.trim()) {
      toast.error("Nama pelanggan wajib diisi")
      return
    }

    setIsLoading(true)

    try {
      const newTransaction = await CustomerTransactionsAPI.create({
        user_id: user.user_id,
        customer_name: formData.customerName.trim(),
        customer_phone: formData.customerPhone.trim() || null,
        notes: formData.notes.trim() || null,
        status: "pending",
      })

      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        notes: "",
      })
      setOpen(false)
      toast.success("Pesanan baru berhasil dibuat!")
      onOrderCreated(newTransaction.id)
    } catch (error) {
      console.error("Error creating order:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat pesanan"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md cotton-candy-card border-pink-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Buat Pesanan Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nama Pelanggan *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              placeholder="Contoh: Ibu Sari"
              className="border-pink-200 focus:border-pink-400"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Nomor Telepon</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange("customerPhone", e.target.value)}
              placeholder="081234567890"
              className="border-pink-200 focus:border-pink-400"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Catatan tambahan untuk pesanan..."
              className="border-pink-200 focus:border-pink-400"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Admin: {user?.full_name || user?.username}</p>
              <p className="text-xs text-blue-600 mt-1">
                Pesanan akan dicatat atas nama Anda sebagai admin yang menangani.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-pink-200 hover:bg-pink-50"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 cotton-candy-button from-green-400 to-emerald-400"
              disabled={isLoading}
            >
              {isLoading ? "Membuat..." : "Buat Pesanan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
