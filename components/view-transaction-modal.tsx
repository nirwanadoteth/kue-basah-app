'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransactionsAPI } from '@/lib/api/transactions';
import {
	ShoppingCart,
	Package,
	User,
	Calendar as CalendarIcon,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { TransactionWithDetails } from '@/lib/supabase';

interface ViewTransactionModalProps {
	trigger: React.ReactNode;
	transactionId: number | null;
	onClose?: () => void;
}

export function ViewTransactionModal({
	trigger,
	transactionId,
	onClose,
}: ViewTransactionModalProps) {
	const [open, setOpen] = useState(false);
	const [transaction, setTransaction] =
		useState<TransactionWithDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const loadTransaction = useCallback(async () => {
		if (!transactionId) return;
		setIsLoading(true);
		try {
			const transactionData = await TransactionsAPI.getById(
				transactionId
			);
			setTransaction(transactionData);
		} catch (error) {
			console.error('Error loading transaction:', error);
			toast.error('Gagal memuat detail transaksi');
		} finally {
			setIsLoading(false);
		}
	}, [transactionId]);

	useEffect(() => {
		if (open && transactionId) {
			loadTransaction();
		}
	}, [open, transactionId, loadTransaction]);

	const handleCloseDialog = () => {
		setOpen(false);
		if (onClose) {
			onClose();
		}
	};

	const renderDetailsView = () =>
		isLoading ? (
			<div className='flex items-center justify-center py-8'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600'></div>
			</div>
		) : transaction ? (
			<div className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
					<div>
						<p className='text-sm text-gray-600 flex items-center gap-2'>
							<User className='h-4 w-4' /> Admin
						</p>
						<p className='font-semibold'>
							{transaction.users?.email}
						</p>
					</div>
					<div>
						<p className='text-sm text-gray-600 flex items-center gap-2'>
							<CalendarIcon className='h-4 w-4' /> Tanggal
						</p>
						<p className='font-semibold'>
							{formatDate(transaction.created_at)}
						</p>
					</div>
					<div className='md:col-span-2'>
						<p className='text-sm text-gray-600'>Total</p>
						<p className='text-2xl font-bold text-green-600'>
							{formatCurrency(transaction.total_price)}
						</p>
					</div>
				</div>

				<div>
					<h4 className='font-semibold text-gray-800 mb-3'>
						Item Transaksi
					</h4>
					{transaction.details.length === 0 ? (
						<div className='text-center py-8 text-gray-500'>
							<Package className='h-12 w-12 mx-auto mb-2 text-gray-300' />
							<p>Belum ada item dalam transaksi</p>
						</div>
					) : (
						<div className='space-y-2'>
							{transaction.details.map((detail) => (
								<div
									key={detail.id}
									className='flex items-center justify-between p-3 bg-white border border-pink-100 rounded-lg'
								>
									<div className='flex-1'>
										<p className='font-medium'>
											{detail.product_name}
										</p>
										<p className='text-sm text-gray-600'>
											{formatCurrency(
												detail.product_price
											)}{' '}
											× {detail.quantity}
										</p>
									</div>
									<div className='flex items-center gap-2'>
										<span className='font-semibold text-green-600'>
											{formatCurrency(detail.subtotal)}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className='flex gap-3 pt-4 border-t'>
					<Button
						variant='outline'
						onClick={handleCloseDialog}
						className='flex-1 border-pink-200 hover:bg-pink-50'
					>
						Tutup
					</Button>
				</div>
			</div>
		) : (
			<div className='text-center py-8 text-red-500'>
				<p>
					Gagal memuat detail transaksi atau transaksi tidak
					ditemukan.
				</p>
			</div>
		);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent
				className='cotton-candy-card border-pink-200 max-h-[90vh] overflow-y-auto sm:max-w-2xl'
				onCloseAutoFocus={onClose}
			>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-gray-800'>
						<ShoppingCart className='h-5 w-5 text-blue-500' />
						Detail Transaksi #{transactionId}
					</DialogTitle>
				</DialogHeader>
				{renderDetailsView()}
			</DialogContent>
		</Dialog>
	);
}
