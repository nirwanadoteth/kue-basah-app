'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Displays a skeleton-based loading placeholder UI for content that is being fetched.
 *
 * Renders a structured layout of skeleton elements to visually indicate loading states for headings, cards, and tabular data.
 */
export function LoadingFallback() {
  return (
    <div className='space-y-6 p-6'>
      <div className='space-y-2 text-center'>
        <Skeleton className='mx-auto h-10 w-64' />
        <Skeleton className='mx-auto h-4 w-96' />
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='cotton-candy-card rounded-2xl border-0'>
            <CardHeader className='pb-3'>
              <Skeleton className='h-4 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-16' />
              <Skeleton className='h-3 w-24' />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='cotton-candy-card rounded-2xl border-0'>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center space-x-4'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-4 w-24' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
