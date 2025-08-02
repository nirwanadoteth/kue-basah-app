'use client'

import { TableSkeleton } from '@/components/loading-skeleton'

/**
 * Displays a skeleton UI as a loading placeholder for the inventory page.
 *
 * This component is shown automatically while the `/inventaris` route is loading, providing visual feedback with animated skeleton elements for the header and table content.
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
