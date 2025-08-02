'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Cake, Sparkles, LogOut, User, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MobileNav } from './mobile-nav'
import { AuthService, type User as AuthUser } from '@/lib/auth'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }
    fetchUser()
  }, [])

  if (pathname === '/login') {
    return null
  }

  const handleLogout = async () => {
    await AuthService.logout()
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/inventaris', label: 'Inventaris' },
    { href: '/pesanan', label: 'Transaksi' },
    { href: '/laporan', label: 'Laporan' },
  ]

  return (
    <nav className='sticky top-0 z-50 border-b border-pink-200/50 bg-white/90 p-4 shadow-sm backdrop-blur-md sm:px-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Cake className='size-8 text-pink-500' />
            <Sparkles className='absolute -right-1 -top-1 size-4 animate-pulse-soft text-purple-400' />
          </div>
          <div>
            <span className='bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent'>
              NAY&apos;S CAKE
            </span>
            <p className='-mt-1 hidden text-xs text-gray-500 sm:block'>
              Sweet Inventory Management
            </p>
          </div>
        </div>

        <div className='hidden space-x-1 md:flex'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg shadow-pink-200/50'
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className='hidden items-center gap-4 md:flex'>
          {user && (
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <User className='size-4' />
              <span className='font-medium'>{user.email}</span>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant='outline'
            size='sm'
            className='rounded-full border-red-200 bg-transparent text-red-600 hover:bg-red-50'
          >
            <LogOut className='mr-2 size-4' />
            Keluar
          </Button>
        </div>

        <div className='md:hidden'>
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant='ghost'
            size='icon'
          >
            {isMobileMenuOpen ? (
              <X className='size-6' />
            ) : (
              <Menu className='size-6' />
            )}
          </Button>
        </div>
      </div>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        user={user}
        logout={handleLogout}
      />
    </nav>
  )
}
