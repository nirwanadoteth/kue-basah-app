'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProductStore } from '@/lib/stores/product-store'
import { AddProductModal } from '@/components/add-product-modal'
import { DeleteProductModal } from '@/components/delete-product-modal'
import { EditProductModal } from '@/components/edit-product-modal'
import {
  Plus,
  Minus,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react'
import { formatCurrency, safeString, safeParseInt } from '@/lib/utils'
import type { Product } from '@/lib/supabase'
import { useEffect } from 'react'
import { DatabaseSetupBanner } from '@/components/database-setup-banner'

export default function Dashboard() {
  const {
    products,
    isLoading,
    error,
    getTotalStock,
    getLowStockItems,
    getTotalValue,
    clearError,
    updateStock,
    fetchProducts,
  } = useProductStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Safe getters with error handling
  const totalStock = (() => {
    try {
      return getTotalStock() || 0
    } catch (err) {
      console.error('Error getting total stock:', err)
      return 0
    }
  })()

  const lowStockItems = (() => {
    try {
      return getLowStockItems() || 0
    } catch (err) {
      console.error('Error getting low stock items:', err)
      return 0
    }
  })()

  const totalValue = (() => {
    try {
      return getTotalValue() || 0
    } catch (err) {
      console.error('Error getting total value:', err)
      return 0
    }
  })()

  const getStockStatus = (
    current: number | undefined,
    min: number | undefined,
  ) => {
    try {
      const currentStock = safeParseInt(current, 0)
      const minStock = safeParseInt(min, 0)

      if (currentStock <= minStock * 0.5) {
        return {
          text: 'Stok Habis',
          color: 'bg-red-100 text-red-800',
          icon: AlertTriangle,
        }
      }
      if (currentStock <= minStock) {
        return {
          text: 'Segera Restock',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertTriangle,
        }
      }
      if (currentStock <= minStock * 1.5) {
        return {
          text: 'Perlu Perhatian',
          color: 'bg-orange-100 text-orange-800',
          icon: Package,
        }
      }
      return {
        text: 'Stok Aman',
        color: 'bg-green-100 text-green-800',
        icon: Package,
      }
    } catch (err) {
      console.error('Error getting stock status:', err)
      return {
        text: 'Unknown',
        color: 'bg-gray-100 text-gray-800',
        icon: Package,
      }
    }
  }

  const handleRefresh = async () => {
    try {
      clearError()
      await fetchProducts()
    } catch (err) {
      console.error('Error refreshing:', err)
    }
  }

  const handleUpdateStock = async (
    productId: number,
    type: 'addition' | 'reduction',
  ) => {
    await updateStock(productId, 1, type)
  }

  // Update the safeProducts array to handle loading state
  const safeProducts = Array.isArray(products) ? products : []

  // Add loading state check before the main return
  if (isLoading && safeProducts.length === 0) {
    return (
      <div className='space-y-6 p-6'>
        <div className='space-y-2'>
          <div className='mx-auto h-8 w-64 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          <div className='mx-auto h-4 w-96 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        </div>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-32 animate-pulse rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100'
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='animate-fade-in space-y-8 p-4 sm:p-6'>
      {/* Error Banner */}
      {error && (
        <div className='flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='size-5 text-red-500' />
            <span className='text-red-700'>{safeString(error)}</span>
          </div>
          <Button
            onClick={handleRefresh}
            size='sm'
            variant='outline'
            className='border-red-200 bg-transparent text-red-600 hover:bg-red-50'
          >
            <RefreshCw className='mr-2 size-4' />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Database Setup Banner */}
      <DatabaseSetupBanner />

      {/* Header */}
      <div className='space-y-2 text-center'>
        <h1 className='bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl'>
          Dashboard
        </h1>
        <div className='flex flex-col justify-center gap-3 sm:flex-row'>
          <Button
            onClick={handleRefresh}
            size='sm'
            variant='outline'
            className='rounded-full border-pink-200 bg-transparent text-pink-600 hover:bg-pink-50'
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </Button>

          <AddProductModal
            trigger={
              <Button className='cotton-candy-button rounded-full from-purple-400 to-indigo-400 px-6'>
                <Plus className='mr-2 size-4' />
                Tambah Produk
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium text-gray-600'>
              <Package className='size-4 text-pink-500' />
              Total Kue dalam Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent'>
              {totalStock}
            </div>
            <p className='mt-1 text-xs text-gray-500'>Semua produk</p>
          </CardContent>
        </Card>

        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium text-gray-600'>
              <AlertTriangle className='size-4 text-yellow-500' />
              Item Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent'>
              {lowStockItems}
            </div>
            <p className='mt-1 text-xs text-gray-500'>Perlu perhatian</p>
          </CardContent>
        </Card>

        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium text-gray-600'>
              <TrendingUp className='size-4 text-green-500' />
              Total Nilai Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent'>
              {formatCurrency(totalValue)}
            </div>
            <p className='mt-1 text-xs text-gray-500'>Nilai keseluruhan</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alert Table */}
      <Card className='cotton-candy-card rounded-2xl border-0 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-xl font-bold text-gray-800'>
              <AlertTriangle className='size-5 text-yellow-500' />
              Status Inventaris
            </CardTitle>
            <div className='text-sm text-gray-500'>
              {safeProducts.length} produk terdaftar
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!safeProducts || safeProducts.length === 0 ? (
            <div className='py-12 text-center'>
              <Package className='mx-auto mb-4 size-12 text-gray-300' />
              <p className='mb-4 text-gray-500'>
                Belum ada produk. Tambahkan produk pertama Anda!
              </p>
              <AddProductModal
                trigger={
                  <Button className='cotton-candy-button rounded-full from-purple-400 to-indigo-400 px-6'>
                    <Plus className='mr-2 size-4' />
                    Tambah Produk Pertama
                  </Button>
                }
              />
            </div>
          ) : (
            <div className='overflow-x-auto md:overflow-x-visible'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-pink-100'>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Produk
                    </th>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Stok Saat Ini
                    </th>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Stok Minimum
                    </th>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Status
                    </th>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Nilai
                    </th>
                    <th className='p-4 text-left font-medium text-gray-600'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {safeProducts.map((item: Product) => {
                    try {
                      const status = getStockStatus(
                        item.current_stock,
                        item.min_stock,
                      )
                      const StatusIcon = status.icon

                      return (
                        <tr
                          key={item.id}
                          className='hover:bg-pink-25 border-b border-pink-50 transition-colors'
                        >
                          <td className='p-4 font-medium text-gray-900'>
                            {safeString(item.name)}
                          </td>
                          <td className='p-4 font-semibold text-gray-600'>
                            {safeParseInt(item.current_stock, 0)}
                          </td>
                          <td className='p-4 text-gray-600'>
                            {safeParseInt(item.min_stock, 0)}
                          </td>
                          <td className='p-4'>
                            <Badge
                              className={`${status.color} flex w-fit items-center gap-1 border-0`}
                            >
                              <StatusIcon className='size-3' />
                              {status.text}
                            </Badge>
                          </td>
                          <td className='p-4 font-medium text-gray-900'>
                            {formatCurrency(item.total_value)}
                          </td>
                          <td className='p-4'>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                className='cotton-candy-button rounded-full from-green-400 to-emerald-400 px-3'
                                onClick={() =>
                                  handleUpdateStock(item.id, 'addition')
                                }
                                disabled={isLoading}
                                title='Tambah Stok'
                              >
                                <Plus className='size-3' />
                              </Button>
                              <Button
                                size='sm'
                                className='cotton-candy-button rounded-full from-blue-400 to-cyan-400 px-3'
                                onClick={() =>
                                  handleUpdateStock(item.id, 'reduction')
                                }
                                disabled={isLoading}
                                title='Kurangi Stok'
                              >
                                <Minus className='size-3' />
                              </Button>
                              <EditProductModal
                                product={item}
                                trigger={
                                  <Button
                                    size='sm'
                                    className='cotton-candy-button rounded-full from-purple-400 to-indigo-400 px-3'
                                    title='Edit Produk'
                                  >
                                    <Edit className='size-3' />
                                  </Button>
                                }
                              />
                              <DeleteProductModal
                                productId={item.id}
                                productName={item.name}
                                trigger={
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='rounded-full border-red-200 bg-transparent px-3 text-red-500 hover:bg-red-50'
                                    title='Hapus Produk'
                                  >
                                    <Trash2 className='size-3' />
                                  </Button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    } catch (error) {
                      console.error('Error rendering product row:', error)
                      return (
                        <tr
                          key={item.id || `error-row-${item.id}`}
                          className='border-b border-pink-50'
                        >
                          <td
                            colSpan={6}
                            className='p-4 text-center text-red-500'
                          >
                            Error loading product data
                          </td>
                        </tr>
                      )
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
