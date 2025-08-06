'use client'

import { TableSkeleton } from '@/components/loading-skeleton'

/**
 * Loading fallback for /pesanan (transactions)
 * Rendered automatically while the route's React.lazy boundary
 * (triggered by useSearchParams()) is being resolved.
 */
export default function TransactionsLoading() {
  return (
    <div className='animate-pulse-soft space-y-6 p-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <div className='h-8 w-64 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          <div className='h-4 w-96 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        </div>
        <div className='h-10 w-48 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
      </div>

      {/* Stats cards skeleton */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='cotton-candy-card rounded-2xl p-4'>
            <div className='h-4 w-24 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
            <div className='mt-2 h-6 w-16 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          </div>
        ))}
      </div>

      {/* Filter controls skeleton */}
      <div className='flex gap-4'>
        <div className='h-10 w-64 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        <div className='h-10 w-32 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
      </div>

      {/* Table skeleton */}
      <TableSkeleton />
    </div>
  )
}
