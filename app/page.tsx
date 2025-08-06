import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cake, Sparkles } from 'lucide-react'
import Dashboard from '@/app/dashboard/page'

export default function HomePage() {
  return (
    <>
      <SignedOut>
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
              <p className='mt-2 text-gray-600'>Sweet Inventory Management</p>
            </CardHeader>

            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <SignInButton mode='modal'>
                  <Button className='cotton-candy-button h-12 w-full rounded-xl from-pink-400 to-purple-400 text-lg font-medium'>
                    Masuk
                  </Button>
                </SignInButton>
              </div>
              <p className='text-center text-sm text-gray-500'>
                Kelola inventaris kue basah dengan mudah dan efisien
              </p>
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </>
  )
}
