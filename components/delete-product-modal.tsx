'use client';

import type React from 'react';
import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/lib/stores/product-store';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteProductModalProps {
	trigger: React.ReactNode;
	productId: number;
	productName: string;
}

export function DeleteProductModal({
	trigger,
	productId,
	productName,
}: DeleteProductModalProps) {
	const [open, setOpen] = useState(false);
	const { deleteProduct, isLoading } = useProductStore();

	const handleDelete = async () => {
		try {
			await deleteProduct(productId);
			setOpen(false);
			toast.success(`Produk "${productName}" berhasil dihapus.`);
		} catch (error) {
			console.error('Error deleting product:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Gagal menghapus produk';
			toast.error(errorMessage);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md cotton-candy-card border-red-200'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-gray-800'>
						<Trash2 className='h-5 w-5 text-red-500' />
						Hapus Produk
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<p className='text-gray-700'>
						Apakah Anda yakin ingin menghapus produk{' '}
						<span className='font-semibold'>
							&quot;{productName}&quot;
						</span>
						? Tindakan ini tidak bisa dibatalkan.
					</p>
					<div className='bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md flex items-start gap-2'>
						<AlertTriangle className='h-5 w-5 mt-0.5' />
						<p className='text-sm'>
							Semua data terkait produk ini (termasuk riwayat
							stok) akan dihapus secara permanen.
						</p>
					</div>
				</div>

				<div className='flex gap-3 pt-4'>
					<Button
						type='button'
						variant='outline'
						onClick={() => setOpen(false)}
						className='flex-1 border-pink-200 hover:bg-pink-50'
						disabled={isLoading}
					>
						Batal
					</Button>
					<Button
						type='button'
						onClick={handleDelete}
						className='flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full'
						disabled={isLoading}
					>
						{isLoading ? 'Menghapus...' : 'Hapus Sekarang'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
