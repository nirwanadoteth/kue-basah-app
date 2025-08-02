import type React from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders a div with a pulsing gradient background to serve as a loading skeleton placeholder.
 *
 * Additional class names and div attributes can be provided via props.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-pink-100 to-purple-100',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
