'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Database,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { useProductStore } from '@/lib/stores/product-store'

export function DatabaseSetupBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const { needsSetup, fetchProducts } = useProductStore()

  const performDatabaseCheck = useCallback(async () => {
    const hasBeenChecked = sessionStorage.getItem('db_check_complete')

    if (hasBeenChecked) {
      setIsChecking(false)
      return
    }

    try {
      setIsChecking(true)
      await fetchProducts()
      setIsVisible(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      sessionStorage.setItem('db_check_complete', 'true')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ''
      const isSetupError =
        errorMessage.includes('Database tables not found') ||
        errorMessage.includes('relation "public.products" does not exist') ||
        errorMessage.includes('JWT')

      setIsVisible(isSetupError)
    } finally {
      setIsChecking(false)
    }
  }, [fetchProducts])

  useEffect(() => {
    performDatabaseCheck()
  }, [performDatabaseCheck])

  const handleRunSetup = () => {
    window.open('/scripts/db.sql', '_blank')
  }

  const handleRetry = async () => {
    await performDatabaseCheck()
  }

  if (isChecking) {
    return (
      <Card className='border-blue-200 bg-blue-50'>
        <CardContent className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='size-5 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <span className='text-blue-700'>Memeriksa koneksi database...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isVisible && !needsSetup && showSuccess) {
    return (
      <Card className='border-green-200 bg-green-50'>
        <CardContent className='p-4'>
          <div className='flex items-center gap-3'>
            <CheckCircle className='size-5 text-green-600' />
            <span className='text-green-700'>
              Database terhubung dan siap digunakan
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isVisible) return null

  return (
    <Card className='border-yellow-200 bg-yellow-50'>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4'>
          <AlertTriangle className='mt-1 size-6 shrink-0 text-yellow-600' />
          <div className='flex-1'>
            <h3 className='mb-2 font-semibold text-yellow-800'>
              Setup Database Diperlukan
            </h3>
            <p className='mb-4 text-yellow-700'>
              Database Supabase belum dikonfigurasi. Ikuti langkah-langkah
              berikut untuk setup:
            </p>

            <div className='mb-4 space-y-3'>
              <div className='flex items-center gap-2 text-sm text-yellow-700'>
                <span className='rounded bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800'>
                  1
                </span>
                Pastikan environment variables Supabase sudah dikonfigurasi di
                .env.local
              </div>
              <div className='flex items-center gap-2 text-sm text-yellow-700'>
                <span className='rounded bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800'>
                  2
                </span>
                Jalankan script SQL untuk membuat tabel dan fungsi
              </div>
              <div className='flex items-center gap-2 text-sm text-yellow-700'>
                <span className='rounded bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800'>
                  3
                </span>
                Refresh halaman setelah setup selesai
              </div>
            </div>

            <div className='flex gap-3'>
              <Button
                onClick={handleRunSetup}
                className='bg-yellow-600 text-white hover:bg-yellow-700'
                size='sm'
              >
                <Database className='mr-2 size-4' />
                Lihat Script SQL
                <ExternalLink className='ml-1 size-3' />
              </Button>

              <Button
                onClick={handleRetry}
                variant='outline'
                className='border-yellow-300 bg-transparent text-yellow-700 hover:bg-yellow-100'
                size='sm'
                disabled={isChecking}
              >
                {isChecking ? 'Memeriksa...' : 'Coba Lagi'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
