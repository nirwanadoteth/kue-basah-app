'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProductStore } from '@/lib/stores/product-store'
import { Edit } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/supabase'

interface EditProductModalProps {
  trigger: React.ReactNode
  product: Product
}

/**
 * Displays a modal dialog for editing the details of an existing product.
 *
 * Renders a form pre-filled with the product's current name, price, and minimum stock. Validates user input and updates the product on submission. Shows the current stock as read-only information. Provides feedback for validation errors and update status.
 *
 * @param trigger - The React node that opens the modal when interacted with
 * @param product - The product object containing current details to edit
 */
export function EditProductModal({ trigger, product }: EditProductModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    minStock: '',
  })

  const { updateProduct, isLoading } = useProductStore()

  const validateEditInputs = (
    name: string,
    price: number,
    minStock: number,
  ) => {
    const errors: string[] = []

    if (!name.trim()) {
      errors.push('Nama produk wajib diisi')
    }

    if (isNaN(price) || price <= 0) {
      errors.push('Harga harus berupa angka yang valid dan lebih dari 0')
    }

    if (isNaN(minStock) || minStock < 0) {
      errors.push(
        'Stok minimum harus berupa angka yang valid dan tidak negatif',
      )
    }

    return errors
  }

  // Initialize form data when modal opens or product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        minStock: product.min_stock?.toString() || '',
      })
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const price = Number.parseFloat(formData.price.trim())
    const minStock = Number.parseInt(formData.minStock.trim(), 10)
    const validationErrors = validateEditInputs(formData.name, price, minStock)

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error))
      return
    }

    try {
      await updateProduct(product.id, {
        name: formData.name.trim(),
        price,
        min_stock: minStock,
      })

      setOpen(false)
      toast.success('Produk berhasil diperbarui!')
    } catch (error) {
      console.error('Error updating product:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal memperbarui produk'
      toast.error(errorMessage)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className='cotton-candy-card border-pink-200 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-gray-800'>
            <Edit className='size-5 text-blue-500' />
            Edit Produk
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-name'>Nama Produk *</Label>
            <Input
              id='edit-name'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder='Nama produk'
              className='border-pink-200 focus:border-pink-400'
              maxLength={100}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-price'>Harga (Rp) *</Label>
            <Input
              id='edit-price'
              type='number'
              min='0'
              step='100'
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder='Harga produk'
              className='border-pink-200 focus:border-pink-400'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-minStock'>Stok Minimum *</Label>
            <Input
              id='edit-minStock'
              type='number'
              min='0'
              value={formData.minStock}
              onChange={(e) => handleInputChange('minStock', e.target.value)}
              placeholder='Stok minimum'
              className='border-pink-200 focus:border-pink-400'
              required
            />
          </div>

          <div className='rounded-lg bg-blue-50 p-3'>
            <div className='text-sm text-gray-600'>
              <div className='flex justify-between'>
                <span>Stok Saat Ini:</span>
                <span className='font-semibold'>
                  {product.current_stock || 0}
                </span>
              </div>
              <div className='mt-1 text-xs text-gray-500'>
                * Stok saat ini tidak dapat diubah melalui form ini. Gunakan
                fitur Tambah/Kurangi Stok.
              </div>
            </div>
          </div>

          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='flex-1 border-pink-200 hover:bg-pink-50'
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type='submit'
              className='cotton-candy-button flex-1 from-blue-400 to-cyan-400'
              disabled={isLoading}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
