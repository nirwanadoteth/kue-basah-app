import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { TransactionsAPI } from '@/lib/api/transactions'
import type { TransactionWithDetails } from '@/lib/supabase'

interface UseTransactionActionsProps {
  transactionId: number | null
  onTransactionUpdated?: () => void
  loadTransaction: () => Promise<void>
}

export function useTransactionActions({
  transactionId,
  onTransactionUpdated,
  loadTransaction,
}: UseTransactionActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAddItem = useCallback(
    async (productId: number, quantity: number) => {
      if (transactionId == null) {
        toast.error('Buat transaksi terlebih dahulu')
        return
      }

      if (!productId || !quantity) {
        toast.error('Pilih produk dan masukkan jumlah')
        return
      }

      if (quantity <= 0) {
        toast.error('Jumlah harus lebih dari 0')
        return
      }

      try {
        setIsLoading(true)
        await TransactionsAPI.addItem(transactionId, productId, quantity)
        await loadTransaction()
        toast.success('Item berhasil ditambahkan')
        onTransactionUpdated?.()
      } catch (error) {
        console.error('Error adding item:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Gagal menambahkan item'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [transactionId, loadTransaction, onTransactionUpdated],
  )

  const handleUpdateQuantity = useCallback(
    async (detailId: number, newQuantity: number) => {
      if (newQuantity <= 0) {
        toast.error('Jumlah harus lebih dari 0')
        return
      }

      try {
        setIsLoading(true)
        await TransactionsAPI.updateItemQuantity(detailId, newQuantity)
        await loadTransaction()
        toast.success('Jumlah berhasil diperbarui')
        onTransactionUpdated?.()
      } catch (error) {
        console.error('Error updating quantity:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Gagal memperbarui jumlah'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [loadTransaction, onTransactionUpdated],
  )

  const handleRemoveItem = useCallback(
    async (detailId: number, productName: string) => {
      if (!window.confirm(`Hapus ${productName} dari transaksi?`)) {
        return
      }

      try {
        setIsLoading(true)
        await TransactionsAPI.removeItem(detailId)
        await loadTransaction()
        toast.success('Item berhasil dihapus')
        onTransactionUpdated?.()
      } catch (error) {
        console.error('Error removing item:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Gagal menghapus item'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [loadTransaction, onTransactionUpdated],
  )

  const handleCompleteTransaction = useCallback(
    async (transaction: TransactionWithDetails) => {
      if (!transaction || transaction.details.length === 0) {
        toast.error('Transaksi harus memiliki minimal 1 item')
        return
      }

      if (
        !window.confirm(
          'Selesaikan transaksi ini? Stok akan dikurangi dan transaksi tidak dapat diubah lagi.',
        )
      ) {
        return
      }

      try {
        setIsLoading(true)
        await TransactionsAPI.complete(transaction.id)
        await loadTransaction()
        toast.success('Transaksi berhasil diselesaikan!')
        onTransactionUpdated?.()
      } catch (error) {
        console.error('Error completing transaction:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Gagal menyelesaikan transaksi'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [loadTransaction, onTransactionUpdated],
  )

  return {
    isLoading,
    handleAddItem,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCompleteTransaction,
  }
}
