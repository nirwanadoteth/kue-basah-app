'use client';

import { TableSkeleton } from '@/components/loading-skeleton';

/**
 * Loading fallback for /inventaris
 * Rendered automatically while the route’s React.lazy boundary
 * (triggered by useSearchParams()) is being resolved.
 */
export default function InventoryLoading() {
	return (
		<div className='p-6 space-y-6 animate-pulse-soft'>
			{/* Header skeleton */}
			<div className='flex items-center justify-between'>
				<div className='space-y-2'>
					<div className='h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded' />
					<div className='h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded' />
				</div>
				<div className='h-10 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded' />
			</div>

			{/* Table skeleton */}
			<TableSkeleton />
		</div>
	);
}
