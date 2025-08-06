'use client'

import type React from 'react'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoadingFallback } from '@/components/loading-fallback'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Define public routes that don't require authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Only redirect if:
    // 1. Not loading
    // 2. Not authenticated
    // 3. Not already on a public route
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      console.log('AuthGuard: Redirecting to login from', pathname)
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, pathname, isPublicRoute])

  // Show loading while checking auth or while redirecting
  if (isLoading) {
    return <LoadingFallback />
  }

  // Show loading if user is not authenticated and not on public route (redirecting)
  if (!isAuthenticated && !isPublicRoute) {
    return <LoadingFallback />
  }

  return <>{children}</>
}
