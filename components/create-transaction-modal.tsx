"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { CustomerTransactionsAPI } from "@/lib/api/customer-transactions"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface CreateTransactionModalProps {
  trigger: React.ReactNode
  onTransactionCreated: (transactionId: number) => void
}

export function CreateTransactionModal({ trigger, onTransactionCreated }: CreateTransactionModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Anda harus login untuk membuat transaksi")
      return
    }

    setIsLoading(true)

    try {
      const newTransaction = await CustomerTransactionsAPI.create({
        user_id: user.user_id,
      })

      setOpen(false)
      toast.success("Transaksi baru berhasil dibuat!")
      onTransactionCreated(newTransaction.id)
    } catch (error) {
      console.error("Error creating transaction:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat transaksi"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md cotton-candy-card border-pink-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Buat Transaksi Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Admin: {user?.full_name || user?.username}</p>
              <p className="text-xs text-blue-600 mt-1">
                Transaksi akan dicatat atas nama Anda sebagai admin yang menangani.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Setelah transaksi dibuat, Anda dapat menambahkan produk dan menyelesaikan pembelian.
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
              {isLoading ? "Membuat..." : "Buat Transaksi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
