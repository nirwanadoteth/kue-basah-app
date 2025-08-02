'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Cake, Sparkles, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { MobileNav } from './mobile-nav';

export function Navbar() {
	const pathname = usePathname();
	const { user, logout, isAuthenticated } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	if (pathname === '/login' || !isAuthenticated) {
		return null;
	}

	const navItems = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/inventaris', label: 'Inventaris' },
		{ href: '/pesanan', label: 'Transaksi' },
		{ href: '/laporan', label: 'Laporan' },
	];

	return (
		<nav className='bg-white/90 backdrop-blur-md border-b border-pink-200/50 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3'>
					<div className='relative'>
						<Cake className='h-8 w-8 text-pink-500' />
						<Sparkles className='h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-pulse-soft' />
					</div>
					<div>
						<span className='text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent'>
							NAY&apos;S CAKE
						</span>
						<p className='text-xs text-gray-500 -mt-1 hidden sm:block'>
							Sweet Inventory Management
						</p>
					</div>
				</div>

				<div className='hidden md:flex space-x-1'>
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
								pathname === item.href
									? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg shadow-pink-200/50'
									: 'text-gray-600 hover:text-pink-500 hover:bg-pink-50'
							}`}
						>
							{item.label}
						</Link>
					))}
				</div>

				<div className='hidden md:flex items-center gap-4'>
					{user && (
						<div className='flex items-center gap-2 text-sm text-gray-600'>
							<User className='h-4 w-4' />
							<span className='font-medium'>{user.username}</span>
						</div>
					)}
					<Button
						onClick={logout}
						variant='outline'
						size='sm'
						className='border-red-200 text-red-600 hover:bg-red-50 rounded-full bg-transparent'
					>
						<LogOut className='h-4 w-4 mr-2' />
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
							<X className='h-6 w-6' />
						) : (
							<Menu className='h-6 w-6' />
						)}
					</Button>
				</div>
			</div>

			<MobileNav
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				navItems={navItems}
			/>
		</nav>
	);
}
