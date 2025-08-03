'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { TransactionsAPI } from '@/lib/api/transactions'
import { useProductStore } from '@/lib/stores/product-store'
import { useTransactionActions } from '@/hooks/use-transaction-actions'
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Package,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { TransactionWithDetails } from '@/lib/supabase'

interface CreateTransactionModalProps {
  trigger: React.ReactNode
  onTransactionCreated: (transactionId: number) => void
  onTransactionUpdated?: () => void
  isOrder?: boolean
  transactionId?: number | null
  isEditable?: boolean
  onClose?: () => void
}

export function CreateTransactionModal({
  trigger,
  onTransactionCreated,
  onTransactionUpdated,
  isOrder = false,
  transactionId: initialTransactionId,
  isEditable = true,
  onClose,
}: CreateTransactionModalProps) {
  const [open, setOpen] = useState(false)
  const [currentTransactionId, setCurrentTransactionId] = useState<
    number | null
  >(initialTransactionId ?? null)
  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(
    null,
  )
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [view, setView] = useState<'create' | 'details'>(
    initialTransactionId ? 'details' : 'create',
  )

  const { user } = useAuth()
  const userId = user?.user_id
  const { products, fetchProducts } = useProductStore()

  const loadTransaction = useCallback(async () => {
    if (!currentTransactionId) return
    try {
      const transactionData =
        await TransactionsAPI.getById(currentTransactionId)
      setTransaction(transactionData)
      if (onTransactionUpdated) onTransactionUpdated()
    } catch (error) {
      console.error('Error loading transaction:', error)
      toast.error('Gagal memuat detail transaksi')
    }
  }, [currentTransactionId, onTransactionUpdated])

  const {
    isLoading,
    handleAddItem,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCompleteTransaction,
  } = useTransactionActions({
    transactionId: currentTransactionId,
    onTransactionUpdated: loadTransaction,
    loadTransaction,
  })

  useEffect(() => {
    if (initialTransactionId) {
      setCurrentTransactionId(initialTransactionId)
      setView('details')
    } else {
      setView('create')
      setTransaction(null)
      setCurrentTransactionId(null)
    }
  }, [initialTransactionId])

  useEffect(() => {
    if (open) {
      if (currentTransactionId) {
        loadTransaction()
        fetchProducts()
        setView('details')
      } else {
        setView('create')
        setTransaction(null)
      }
    } else if (onClose) {
      onClose()
    }
  }, [open, currentTransactionId, fetchProducts, loadTransaction, onClose])

  const handleCreateAndOpenDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Anda harus login untuk membuat transaksi')
      return
    }

    try {
      const newTransaction = await TransactionsAPI.create({
        user_id: userId,
      })
      toast.success('Transaksi baru berhasil dibuat!')
      onTransactionCreated(newTransaction.id)
      setCurrentTransactionId(newTransaction.id)
      setView('details')
    } catch (error) {
      console.error('Error creating transaction:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal membuat transaksi'
      toast.error(errorMessage)
    }
  }

  const handleAddItemClick = async () => {
    if (!selectedProductId || !quantity) {
      toast.error('Pilih produk dan masukkan jumlah')
      return
    }
    const qty = Number.parseInt(quantity)
    if (qty <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }
    await handleAddItem(Number.parseInt(selectedProductId), qty)
    setSelectedProductId('')
    setQuantity('1')
  }

  const handleCompleteTransactionClick = async () => {
    if (!transaction) return
    await handleCompleteTransaction(transaction)
    setOpen(false)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    if (!initialTransactionId) {
      setView('create')
      setCurrentTransactionId(null)
      setTransaction(null)
    }
  }

  const availableProducts = products.filter(
    (product) =>
      !transaction?.details.some((detail) => detail.product_id === product.id),
  )

  const renderCreateView = () => (
    <form onSubmit={handleCreateAndOpenDetails} className='space-y-4'>
      <div className='rounded-lg bg-blue-50 p-3'>
        <div className='text-sm text-blue-800'>
          <p className='font-medium'>Admin: {user?.username}</p>
          <p className='mt-1 text-xs text-blue-600'>
            {isOrder
              ? 'Pesanan akan dicatat atas nama Anda sebagai admin.'
              : 'Transaksi cepat akan dicatat atas nama Anda.'}
          </p>
        </div>
      </div>
      <div className='flex gap-3 pt-4'>
        <Button
          type='button'
          variant='outline'
          onClick={handleCloseDialog}
          className='flex-1 border-pink-200 hover:bg-pink-50'
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type='submit'
          className='cotton-candy-button flex-1 from-green-400 to-emerald-400'
          disabled={isLoading}
        >
          {isLoading
            ? 'Membuat...'
            : isOrder
              ? 'Buat Pesanan'
              : 'Buat Transaksi'}
        </Button>
      </div>
    </form>
  )

  const renderDetailsView = () =>
    isLoading && !transaction ? (
      <div className='flex items-center justify-center py-8'>
        <div className='size-8 animate-spin rounded-full border-b-2 border-pink-600'></div>
      </div>
    ) : transaction ? (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2'>
          <div>
            <p className='text-sm text-gray-600'>Admin</p>
            <p className='font-semibold'>{transaction.users?.username}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Tanggal</p>
            <p className='font-semibold'>
              {formatDate(transaction.created_at)}
            </p>
          </div>
          <div className='md:col-span-2'>
            <p className='text-sm text-gray-600'>Total</p>
            <p className='text-2xl font-bold text-green-600'>
              {formatCurrency(transaction.total_price)}
            </p>
          </div>
        </div>

        {isEditable && (
          <div className='rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-3 font-semibold text-blue-800'>Tambah Item</h4>
            <div className='flex gap-3'>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className='flex-1'>
                  <SelectValue placeholder='Pilih produk' />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {formatCurrency(product.price)} (Stok:{' '}
                      {product.current_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type='number'
                min='1'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder='Jumlah'
                className='w-24'
              />
              <Button
                onClick={handleAddItemClick}
                disabled={isLoading || !selectedProductId}
                className='cotton-candy-button from-blue-400 to-cyan-400'
              >
                <Plus className='size-4' />
              </Button>
            </div>
          </div>
        )}

        <div>
          <h4 className='mb-3 font-semibold text-gray-800'>Item Transaksi</h4>
          {transaction.details.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>
              <Package className='mx-auto mb-2 size-12 text-gray-300' />
              <p>Belum ada item dalam transaksi</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {transaction.details.map((detail) => (
                <div
                  key={detail.id}
                  className='flex items-center justify-between rounded-lg border border-pink-100 bg-white p-3'
                >
                  <div className='flex-1'>
                    <p className='font-medium'>{detail.product_name}</p>
                    <p className='text-sm text-gray-600'>
                      {formatCurrency(detail.product_price)} × {detail.quantity}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-green-600'>
                      {formatCurrency(detail.subtotal)}
                    </span>
                    {isEditable && (
                      <>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleUpdateQuantity(detail.id, detail.quantity - 1)
                          }
                          disabled={isLoading || detail.quantity <= 1}
                          className='size-8 p-0'
                        >
                          <Minus className='size-3' />
                        </Button>
                        <span className='w-8 text-center text-sm'>
                          {detail.quantity}
                        </span>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleUpdateQuantity(detail.id, detail.quantity + 1)
                          }
                          disabled={isLoading}
                          className='size-8 p-0'
                        >
                          <Plus className='size-3' />
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleRemoveItem(detail.id, detail.product_name)
                          }
                          disabled={isLoading}
                          className='size-8 border-red-200 p-0 text-red-500 hover:bg-red-50'
                        >
                          <Trash2 className='size-3' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex gap-3 border-t pt-4'>
          <Button
            variant='outline'
            onClick={handleCloseDialog}
            className='flex-1 border-pink-200 hover:bg-pink-50'
          >
            Tutup
          </Button>
          {isEditable && transaction.details.length > 0 && (
            <Button
              onClick={handleCompleteTransactionClick}
              disabled={isLoading}
              className='cotton-candy-button flex-1 from-green-400 to-emerald-400'
            >
              <CheckCircle className='mr-2 size-4' />
              {isLoading ? 'Memproses...' : 'Selesaikan Transaksi'}
            </Button>
          )}
        </div>
      </div>
    ) : (
      <div className='py-8 text-center text-red-500'>
        <p>Gagal memuat detail transaksi</p>
      </div>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        className={`cotton-candy-card max-h-[90vh] overflow-y-auto border-pink-200 ${
          view === 'details' ? 'sm:max-w-4xl' : 'sm:max-w-md'
        }`}
        onCloseAutoFocus={() => {
          if (!initialTransactionId) {
            setView('create')
            setCurrentTransactionId(null)
            setTransaction(null)
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-gray-800'>
            <ShoppingCart
              className={`size-5 ${
                view === 'create' ? 'text-green-500' : 'text-blue-500'
              }`}
            />
            {view === 'create'
              ? isOrder
                ? 'Buat Pesanan Baru'
                : 'Buat Transaksi Cepat'
              : `Detail Transaksi #${currentTransactionId}`}
          </DialogTitle>
        </DialogHeader>
        {view === 'create' ? renderCreateView() : renderDetailsView()}
      </DialogContent>
    </Dialog>
  )
}
