'use client'

import { TableSkeleton } from '@/components/loading-skeleton'

/**
 * Loading fallback for /inventaris
 * Rendered automatically while the route’s React.lazy boundary
 * (triggered by useSearchParams()) is being resolved.
 */
export default function InventoryLoading() {
  return (
    <div className='animate-pulse-soft space-y-6 p-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <div className='h-8 w-64 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
          <div className='h-4 w-96 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
        </div>
        <div className='h-10 w-64 rounded bg-gradient-to-r from-pink-100 to-purple-100' />
      </div>

      {/* Table skeleton */}
      <TableSkeleton />
    </div>
  )
}
