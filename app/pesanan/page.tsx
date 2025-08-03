'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TransactionsAPI } from '@/lib/api/transactions'
import { CreateTransactionModal } from '@/components/create-transaction-modal'
import { ViewTransactionModal } from '@/components/view-transaction-modal'
import { TableSkeleton } from '@/components/loading-skeleton'
import {
  Search,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
  Sparkles,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react'
import type { TransactionWithDetails } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function TransactionsPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithDetails[]
  >([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const handleViewDetails = (transactionId: number) => {
    setSelectedTransactionId(transactionId)
    setIsViewModalOpen(true)
  }

  const handleViewModalClose = () => {
    setIsViewModalOpen(false)
    setSelectedTransactionId(null)
  }

  const loadTransactions = useCallback(async () => {
    try {
      const transactionsData = await TransactionsAPI.getAll()
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Error loading transactions:', error)
      throw error
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const statsData = await TransactionsAPI.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
      // Don't throw here, stats are not critical
    }
  }, [])

  const initializeData = useCallback(async () => {
    try {
      setIsInitialLoading(true)
      setError(null)
      await Promise.all([loadTransactions(), loadStats()])
    } catch (error) {
      console.error('Failed to initialize data:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal memuat data'
      setError(errorMessage)
    } finally {
      setIsInitialLoading(false)
    }
  }, [loadTransactions, loadStats])

  const filterTransactions = useCallback(() => {
    let filtered = transactions

    // Apply search filter by transaction ID, or admin name
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = transactions.filter(
        (transaction) =>
          transaction.id.toString().includes(searchLower) ||
          transaction.users?.username?.toLowerCase().includes(searchLower),
      )
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const filterDate = new Date()

      try {
        switch (dateFilter) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0)
            filtered = filtered.filter((t: TransactionWithDetails) => {
              const transactionDate = new Date(t.created_at)
              return transactionDate >= filterDate
            })
            break
          case 'week':
            filterDate.setDate(today.getDate() - 7)
            filtered = filtered.filter((t: TransactionWithDetails) => {
              const transactionDate = new Date(t.created_at)
              return transactionDate >= filterDate
            })
            break
          case 'month':
            filterDate.setMonth(today.getMonth() - 1)
            filtered = filtered.filter((t: TransactionWithDetails) => {
              const transactionDate = new Date(t.created_at)
              return transactionDate >= filterDate
            })
            break
        }
      } catch (error) {
        console.error('Date filtering error:', error)
      }
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, dateFilter])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  useEffect(() => {
    filterTransactions()
  }, [filterTransactions])

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([loadTransactions(), loadStats()])
      toast.success('Data berhasil diperbarui')
    } catch (error) {
      console.error('Failed to refresh data:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal memperbarui data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransactionCreated = (transactionId: number) => {
    loadTransactions()
    loadStats()
    setSelectedTransactionId(transactionId)
  }

  const handleTransactionUpdated = () => {
    loadTransactions()
    loadStats()
  }

  if (isInitialLoading) {
    return (
      <div className='space-y-6 p-6'>
        <div className='space-y-2'>
          <div className='h-8 w-64 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          <div className='h-4 w-96 animate-pulse rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='h-24 animate-pulse rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100'
            />
          ))}
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
            <ShoppingCart className='size-5 text-red-500' />
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

      {/* Header */}
      <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
        <div>
          <h1 className='flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent'>
            <ShoppingCart className='size-8 text-pink-500' />
            Pesanan & Transaksi
          </h1>
          <p className='mt-1 flex items-center gap-2 text-gray-600'>
            <Sparkles className='size-4 text-purple-400' />
            Kelola pesanan pelanggan dan transaksi penjualan cepat
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
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

          <CreateTransactionModal
            trigger={
              <Button className='cotton-candy-button rounded-full from-green-400 to-emerald-400 px-6'>
                <Plus className='mr-2 size-4' />
                Buat Pesanan
              </Button>
            }
            onTransactionCreated={handleTransactionCreated}
            onTransactionUpdated={handleTransactionUpdated}
            isOrder={true}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4'>
        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:shadow-xl'>
          <CardContent className='p-4 text-center'>
            <div className='mb-2 flex items-center justify-center gap-2'>
              <ShoppingCart className='size-5 text-blue-500' />
              <span className='text-sm font-medium text-gray-600'>
                Total Transaksi
              </span>
            </div>
            <div className='text-2xl font-bold text-blue-500'>
              {stats.totalTransactions}
            </div>
          </CardContent>
        </Card>

        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:shadow-xl'>
          <CardContent className='p-4 text-center'>
            <div className='mb-2 flex items-center justify-center gap-2'>
              <TrendingUp className='size-5 text-purple-500' />
              <span className='text-sm font-medium text-gray-600'>
                Total Pendapatan
              </span>
            </div>
            <div className='text-lg font-bold text-purple-500'>
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:shadow-xl'>
          <CardContent className='p-4 text-center'>
            <div className='mb-2 flex items-center justify-center gap-2'>
              <Calendar className='size-5 text-indigo-500' />
              <span className='text-sm font-medium text-gray-600'>
                Pendapatan Hari Ini
              </span>
            </div>
            <div className='text-lg font-bold text-indigo-500'>
              {formatCurrency(stats.todayRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className='cotton-candy-card rounded-2xl border-0 transition-all duration-300 hover:shadow-xl'>
          <CardContent className='p-4 text-center'>
            <div className='mb-2 flex items-center justify-center gap-2'>
              <DollarSign className='size-5 text-green-500' />
              <span className='text-sm font-medium text-gray-600'>
                Rata-rata/Pesanan
              </span>
            </div>
            <div className='text-lg font-bold text-green-500'>
              {formatCurrency(stats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Cari (ID, nama admin)...'
            className='rounded-full border-pink-200 pl-10 focus:border-pink-400'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className='rounded-full border border-pink-200 bg-white px-4 py-2 focus:border-pink-400 focus:outline-none'
        >
          <option value='all'>Semua Tanggal</option>
          <option value='today'>Hari Ini</option>
          <option value='week'>7 Hari Terakhir</option>
          <option value='month'>30 Hari Terakhir</option>
        </select>
      </div>

      {/* Transactions Table */}
      <Card className='cotton-candy-card overflow-hidden rounded-2xl border-0 shadow-lg'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gradient-to-r from-pink-50 to-purple-50'>
                <tr>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    ID
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Admin
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Items
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Total
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Tanggal
                  </th>
                  <th className='px-6 py-4 text-left font-semibold text-gray-700'>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='py-12 text-center text-gray-500'>
                      <ShoppingCart className='mx-auto mb-4 size-12 text-gray-300' />
                      {searchTerm || dateFilter !== 'all'
                        ? 'Tidak ada transaksi yang ditemukan'
                        : 'Belum ada transaksi'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className='hover:from-pink-25 hover:to-purple-25 border-b border-pink-50 transition-all duration-200 hover:bg-gradient-to-r'
                    >
                      <td className='px-6 py-4 font-medium text-gray-900'>
                        #{transaction.id}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <div className='flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-200 to-purple-200'>
                            <User className='size-4 text-pink-600' />
                          </div>
                          <span className='font-semibold text-gray-900'>
                            {transaction.users?.username}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-gray-600'>
                        {transaction.details.length} item
                      </td>
                      <td className='px-6 py-4'>
                        <div className='font-bold text-green-600'>
                          {formatCurrency(transaction.total_price)}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-gray-600'>
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className='px-6 py-4'>
                        <ViewTransactionModal
                          trigger={
                            <Button
                              size='sm'
                              className='cotton-candy-button rounded-full from-blue-400 to-cyan-400 px-3'
                              title='Lihat Detail'
                              onClick={() => handleViewDetails(transaction.id)}
                            >
                              <Eye className='size-3' />
                            </Button>
                          }
                          transactionId={transaction.id}
                          onClose={handleViewModalClose}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
