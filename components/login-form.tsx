'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Lock, Cake, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const validateLoginInputs = (username: string, password: string) => {
    const errors: string[] = []

    if (!username.trim()) {
      errors.push('Username wajib diisi')
    }

    if (!password) {
      errors.push('Password wajib diisi')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateLoginInputs(
      formData.username,
      formData.password,
    )

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error))
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Attempt to migrate the user. This runs on every login attempt
      // for a legacy user. The API is idempotent and will only migrate a user once.
      // We don't block login if this fails; we'll just try again next time.
      try {
        await fetch('/api/migrate-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username.trim().toLowerCase(),
            password: formData.password,
          }),
        })
      } catch (migrationError) {
        console.error('User migration request failed:', migrationError)
        // We don't notify the user about this, as it's a background process.
      }

      // Step 2: Attempt to sign in using the new auth provider.
      const { error } = await authClient.signIn.username({
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
      })

      if (error) {
        // Use a generic error message for security.
        throw new Error('Username atau password salah')
      }

      toast.success('Login berhasil! Selamat datang kembali')
      router.push('/')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login gagal'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6'>
      <Card className='cotton-candy-card w-full max-w-md border-0 shadow-2xl'>
        <CardHeader className='pb-8 text-center'>
          <div className='mb-4 flex items-center justify-center'>
            <div className='relative'>
              <Cake className='size-12 text-pink-500' />
              <Sparkles className='absolute -right-1 -top-1 size-6 animate-pulse-soft text-purple-400' />
            </div>
          </div>
          <CardTitle className='bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent'>
            NAY&apos;S CAKE
          </CardTitle>
          <p className='mt-2 text-gray-600'>Masuk ke Sistem Inventaris</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='username' className='font-medium text-gray-700'>
                Username
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                <Input
                  id='username'
                  type='text'
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username', e.target.value)
                  }
                  placeholder='Masukkan username'
                  className='h-12 rounded-xl border-pink-200 pl-10 focus:border-pink-400'
                  disabled={isSubmitting}
                  required
                  autoComplete='username'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='font-medium text-gray-700'>
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  placeholder='Masukkan password'
                  className='h-12 rounded-xl border-pink-200 pl-10 focus:border-pink-400'
                  disabled={isSubmitting}
                  required
                  autoComplete='current-password'
                />
              </div>
            </div>

            <Button
              type='submit'
              disabled={isSubmitting}
              className='cotton-candy-button h-12 w-full rounded-xl from-pink-400 to-purple-400 text-lg font-medium'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 size-5 animate-spin' />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
