'use client'

import type React from 'react'
import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddProductModalProps {
  trigger: React.ReactNode
}

export function AddProductModal({ trigger }: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [minStock, setMinStock] = useState('20')

  const { addProduct, isLoading } = useProductStore()

  const validateInputs = (
    name: string,
    price: number,
    currentStock: number,
    minStock: number,
  ) => {
    const errors: string[] = []

    if (!name.trim()) {
      errors.push('Nama produk wajib diisi')
    }

    if (isNaN(price) || price <= 0) {
      errors.push('Harga harus berupa angka yang valid dan lebih dari 0')
    }

    if (isNaN(currentStock) || currentStock < 0) {
      errors.push('Stok awal harus berupa angka yang valid dan tidak negatif')
    }

    if (isNaN(minStock) || minStock < 0) {
      errors.push(
        'Stok minimum harus berupa angka yang valid dan tidak negatif',
      )
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceValue = Number.parseFloat(price.trim())
    const currentStockValue = Number.parseInt(currentStock.trim())
    const minStockValue = Number.parseInt(minStock?.trim() || '20')

    const validationErrors = validateInputs(
      name,
      priceValue,
      currentStockValue,
      minStockValue,
    )

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error))
      return
    }

    try {
      await addProduct({
        name: name.trim(),
        price: priceValue,
        current_stock: currentStockValue,
        min_stock: minStockValue,
      })

      // Reset form
      setName('')
      setPrice('')
      setCurrentStock('')
      setMinStock('20')
      setOpen(false)
      toast.success('Produk berhasil ditambahkan!')
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal menambahkan produk'
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className='cotton-candy-card border-pink-200 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-gray-800'>
            <Plus className='size-5 text-green-500' />
            Tambah Produk Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Nama Produk *</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Contoh: Kue Lapis Legit'
              className='border-pink-200 focus:border-pink-400'
              maxLength={100}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='price'>Harga (Rp) *</Label>
            <Input
              id='price'
              type='number'
              min='0'
              step='100'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder='5000'
              className='border-pink-200 focus:border-pink-400'
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='currentStock'>Stok Awal *</Label>
              <Input
                id='currentStock'
                type='number'
                min='0'
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder='50'
                className='border-pink-200 focus:border-pink-400'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='minStock'>Stok Minimum</Label>
              <Input
                id='minStock'
                type='number'
                min='0'
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder='20'
                className='border-pink-200 focus:border-pink-400'
              />
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
              className='cotton-candy-button flex-1 from-green-400 to-emerald-400'
              disabled={isLoading}
            >
              {isLoading ? 'Menyimpan...' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
