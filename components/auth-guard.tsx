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

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, pathname])

  if (isLoading || (!isAuthenticated && pathname !== '/login')) {
    return <LoadingFallback />
  }

  return <>{children}</>
}
