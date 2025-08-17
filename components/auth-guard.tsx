'use client'

import type React from 'react'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { LoadingFallback } from '@/components/loading-fallback'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = !!session

  useEffect(() => {
    if (!isPending && !isAuthenticated && pathname !== '/login') {
      router.push('/login')
    }
  }, [isAuthenticated, isPending, router, pathname])

  if (isPending || (!isAuthenticated && pathname !== '/login')) {
    return <LoadingFallback />
  }

  return <>{children}</>
}
