'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface MobileNavProps {
	isOpen: boolean;
	onClose: () => void;
	navItems: { href: string; label: string }[];
}

export function MobileNav({ isOpen, onClose, navItems }: MobileNavProps) {
	const pathname = usePathname();
	const { user, logout } = useAuth();

	if (!isOpen) return null;

	return (
		<div className='md:hidden mt-4 pt-4 border-t border-pink-100'>
			<div className='flex flex-col space-y-2'>
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						onClick={onClose}
						className={`px-4 py-2 rounded-md text-base font-medium transition-colors ${
							pathname === item.href
								? 'bg-pink-100 text-pink-700'
								: 'text-gray-700 hover:bg-pink-50'
						}`}
					>
						{item.label}
					</Link>
				))}
			</div>
			<div className='mt-4 pt-4 border-t border-pink-100 flex flex-col space-y-3'>
				{user && (
					<div className='flex items-center gap-3 px-4 text-base font-medium text-gray-700'>
						<User className='h-5 w-5' />
						<span>{user.username}</span>
					</div>
				)}
				<Button
					onClick={async () => {
						await logout();
						onClose();
					}}
					variant='ghost'
					className='w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 px-4 py-2 text-base font-medium'
				>
					<LogOut className='h-5 w-5 mr-3' />
					Keluar
				</Button>
			</div>
		</div>
	);
}
