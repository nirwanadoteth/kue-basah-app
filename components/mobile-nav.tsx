"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User, X } from "lucide-react"
import type { User as AuthUser } from "@/lib/auth"

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: Array<{ href: string; label: string }>
  user: AuthUser | null
  logout: () => void
}

export function MobileNav({ isOpen, onClose, navItems, user, logout }: MobileNavProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-gray-900">Menu</span>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white"
                  : "text-gray-600 hover:text-pink-500 hover:bg-pink-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <User className="h-4 w-4" />
              <span className="font-medium truncate">{user.email}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
