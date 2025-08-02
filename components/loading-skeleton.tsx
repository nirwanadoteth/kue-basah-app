import { Skeleton } from '@/components/ui/skeleton';

/**
 * Renders a skeleton placeholder for a dashboard layout while content is loading.
 *
 * Displays header, summary cards, and a detailed list section using skeleton elements to mimic the final dashboard structure.
 */
export function DashboardSkeleton() {
	return (
		<div className='p-6 space-y-6'>
			<div className='space-y-2'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-4 w-96' />
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{[1, 2, 3].map((i) => (
					<div key={i} className='cotton-candy-card rounded-2xl p-6'>
						<Skeleton className='h-4 w-32 mb-4' />
						<Skeleton className='h-8 w-16' />
					</div>
				))}
			</div>

			<div className='cotton-candy-card rounded-2xl p-6'>
				<Skeleton className='h-6 w-48 mb-6' />
				<div className='space-y-4'>
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className='flex items-center space-x-4'>
							<Skeleton className='h-4 w-32' />
							<Skeleton className='h-4 w-16' />
							<Skeleton className='h-4 w-16' />
							<Skeleton className='h-6 w-24' />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Displays a placeholder skeleton for a table with six rows.
 *
 * Renders a card containing six rows of skeleton elements, each row simulating the appearance of table data while content is loading.
 */
export function TableSkeleton() {
	return (
		<div className='cotton-candy-card rounded-2xl p-6'>
			<div className='space-y-4'>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className='flex items-center space-x-4'>
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-4 w-16' />
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-4 w-24' />
					</div>
				))}
			</div>
		</div>
	);
}
