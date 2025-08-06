import type React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ConnectionStatus } from '@/components/connection-status'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "NAY'S CAKE - Sweet Inventory Management",
  description:
    'Sistem manajemen inventaris modern untuk toko kue basah dengan tema cotton candy yang manis',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang='id'>
        <header>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        <body className={inter.className}>
          <header>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <ErrorBoundary>
            <div className='min-h-screen'>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <ConnectionStatus />
            </div>
            <Toaster position='top-right' />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
