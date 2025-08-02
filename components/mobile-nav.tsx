'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import type { User as AuthUser } from '@/lib/auth'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: { href: string; label: string }[]
  user: AuthUser | null
  logout: () => void
}

export function MobileNav({
  isOpen,
  onClose,
  navItems,
  user,
  logout,
}: MobileNavProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  return (
    <div className='mt-4 border-t border-pink-100 pt-4 md:hidden'>
      <div className='flex flex-col space-y-2'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-base font-medium transition-colors ${
              pathname === item.href
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-700 hover:bg-pink-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className='mt-4 flex flex-col space-y-3 border-t border-pink-100 pt-4'>
        {user && (
          <div className='flex items-center gap-3 px-4 text-base font-medium text-gray-700'>
            <User className='size-5' />
            <span>{user.email}</span>
          </div>
        )}
        <Button
          onClick={async () => {
            await logout()
            onClose()
          }}
          variant='ghost'
          className='w-full justify-start px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700'
        >
          <LogOut className='mr-3 size-5' />
          Keluar
        </Button>
      </div>
    </div>
  )
}
