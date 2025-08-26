'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import LoginForm from '@/components/login-form'
import { LoadingFallback } from '@/components/loading-fallback'

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const isAuthenticated = !!session

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (!isPending && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isPending, router])

  // Show loading while checking authentication
  if (isPending) {
    return <LoadingFallback />
  }

  // If already authenticated, don't show login form
  if (isAuthenticated) {
    return <LoadingFallback />
  }

  return <LoginForm />
}
