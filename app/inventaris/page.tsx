'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useProductStore } from '@/lib/stores/product-store'
import { AddProductModal } from '@/components/add-product-modal'
import { DeleteProductModal } from '@/components/delete-product-modal'
import { EditProductModal } from '@/components/edit-product-modal'
import { TableSkeleton } from '@/components/loading-skeleton'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Sparkles,
  RefreshCw,
  Minus,
} from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { DatabaseSetupBanner } from '@/components/database-setup-banner'

/**
 * Displays and manages the inventory of products, providing features for searching, adding, editing, deleting, and updating stock.
 *
 * Fetches product data on mount, filters products by search term, and renders summary statistics and an inventory table with interactive controls for stock management and product CRUD operations. Handles loading and error states, and includes a database setup banner.
 *
 * @returns The rendered inventory management UI component.
 */
export default function InventoryManagement() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  const { isLoading, error, updateStock, clearError, fetchProducts, products } =
    useProductStore()

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchProducts()
      } catch (error) {
        console.error('Failed to initialize data:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    initializeData()
  }, [fetchProducts])

  useEffect(() => {
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(lowerCaseSearchTerm),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  const handleUpdateStock = async (
    productId: number,
    type: 'addition' | 'reduction',
  ) => {
    await updateStock(productId, 1, type)
  }

  const handleRefresh = async () => {
    clearError()
    try {
      await fetchProducts()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  if (isInitialLoading) {
    return (
      <div className='space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <div className='h-8 w-64 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
            <div className='h-4 w-96 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          </div>
          <div className='h-10 w-64 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className='animate-fade-in space-y-8 p-6'>
      {/* Error Banner */}
      {error && (
        <div className='flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4'>
          <div className='flex items-center gap-2'>
            <Package className='size-5 text-red-500' />
            <span className='text-red-700'>{error}</span>
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
      <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent'>
            <Package className='size-8 text-pink-500' />
            Manajemen Inventaris
          </h1>
          <p className='mt-1 flex items-center gap-2 text-gray-600'>
            <Sparkles className='size-4 text-purple-400' />
            Kelola semua produk kue basah Anda
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Cari produk...'
              className='w-64 rounded-full border-pink-200 pl-10 focus:border-pink-400'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            onClick={handleRefresh}
            variant='outline'
            className='rounded-full border-pink-200 bg-transparent px-4 text-pink-600 hover:bg-pink-50'
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <AddProductModal
            trigger={
              <Button className='cotton-candy-button rounded-full from-green-400 to-emerald-400 px-6'>
                <Plus className='mr-2 size-4' />
                Tambah Produk
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card className='cotton-candy-card rounded-2xl border-0 p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-pink-500'>
              {filteredProducts.length}
            </div>
            <div className='text-sm text-gray-600'>Total Produk</div>
          </div>
        </Card>
        <Card className='cotton-candy-card rounded-2xl border-0 p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-500'>
              {filteredProducts.reduce(
                (sum, p) => sum + (p?.current_stock || 0),
                0,
              )}
            </div>
            <div className='text-sm text-gray-600'>Total Stok</div>
          </div>
        </Card>
        <Card className='cotton-candy-card rounded-2xl border-0 p-4'>
          <div className='text-center'>
            <div className='text-lg font-bold text-indigo-500'>
              {formatCurrency(
                filteredProducts.reduce(
                  (sum, p) => sum + (p?.total_value || 0),
                  0,
                ),
              )}
            </div>
            <div className='text-sm text-gray-600'>Total Nilai</div>
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className='cotton-candy-card overflow-hidden rounded-2xl border-0 shadow-lg'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gradient-to-r from-pink-50 to-purple-50'>
                <tr>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Produk
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Stok
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Harga
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Total Nilai
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='py-12 text-center text-gray-500'>
                      <Package className='mx-auto mb-4 size-12 text-gray-300' />
                      {searchTerm ? (
                        <div>
                          <p className='mb-4'>
                            Tidak ada produk yang ditemukan untuk &quot;
                            {searchTerm}&quot;
                          </p>
                          <AddProductModal
                            trigger={
                              <Button className='cotton-candy-button rounded-full from-green-400 to-emerald-400 px-6'>
                                <Plus className='mr-2 size-4' />
                                Tambah Produk Baru
                              </Button>
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <p className='mb-4'>
                            Belum ada produk. Tambahkan produk pertama Anda!
                          </p>
                          <AddProductModal
                            trigger={
                              <Button className='cotton-candy-button rounded-full from-green-400 to-emerald-400 px-6'>
                                <Plus className='mr-2 size-4' />
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
                    if (!item || typeof item !== 'object') {
                      return null
                    }

                    return (
                      <tr
                        key={item.id}
                        className='hover:from-pink-25 hover:to-purple-25 border-b border-pink-50 transition-all duration-200 hover:bg-gradient-to-r'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-200 to-purple-200'>
                              <Package className='size-5 text-pink-600' />
                            </div>
                            <div>
                              <div className='font-semibold text-gray-900'>
                                {item.name || 'Unknown Product'}
                              </div>
                              <div className='text-xs text-gray-500'>
                                Min: {item.min_stock || 0}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`text-lg font-bold ${
                                (item.current_stock || 0) <=
                                (item.min_stock || 0)
                                  ? 'text-red-500'
                                  : (item.current_stock || 0) <=
                                      (item.min_stock || 0) * 1.5
                                    ? 'text-yellow-500'
                                    : 'text-green-500'
                              }`}
                            >
                              {item.current_stock || 0}
                            </span>
                            <span className='text-sm text-gray-400'>pcs</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 font-medium text-gray-700'>
                          {formatCurrency(item.price || 0)}
                        </td>
                        <td className='px-6 py-4 font-bold text-gray-900'>
                          {formatCurrency(item.total_value || 0)}
                        </td>
                        <td className='px-6 py-4'>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
