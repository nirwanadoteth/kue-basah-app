import type React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ConnectionStatus } from '@/components/connection-status'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "NAY'S CAKE - Sweet Inventory Management",
  description:
    'Sistem manajemen inventaris modern untuk toko kue basah dengan tema cotton candy yang manis',
  generator: 'v0.dev',
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const pathname = (await headers()).get('next-url') || ''

  if (error || !data?.user) {
    if (pathname !== '/login') {
      redirect('/login')
    }
  }

  return (
    <html lang='id'>
      <body className={inter.className}>
        <ErrorBoundary>
          <div className='min-h-screen'>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ConnectionStatus />
          </div>
          <Toaster position='top-right' />
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  )
}
