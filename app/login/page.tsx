'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import LoginForm from '@/components/login-form'
import { LoadingFallback } from '@/components/loading-fallback'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (!isLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingFallback />
  }

  // If already authenticated, don't show login form
  if (isAuthenticated) {
    return <LoadingFallback />
  }

  return <LoginForm />
}
