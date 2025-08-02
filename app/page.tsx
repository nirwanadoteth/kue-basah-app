'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/lib/stores/product-store';
import { AddProductModal } from '@/components/add-product-modal';
import { DeleteProductModal } from '@/components/delete-product-modal';
import { EditProductModal } from '@/components/edit-product-modal';
import {
	Plus,
	Minus,
	TrendingUp,
	Package,
	AlertTriangle,
	RefreshCw,
	Edit,
	Trash2,
} from 'lucide-react';
import { formatCurrency, safeString, safeParseInt } from '@/lib/utils';
import type { Product } from '@/lib/supabase';
import { useEffect } from 'react';
import { DatabaseSetupBanner } from '@/components/database-setup-banner';

export default function Dashboard() {
	const {
		products,
		isLoading,
		error,
		getTotalStock,
		getLowStockItems,
		getTotalValue,
		clearError,
		updateStock,
		fetchProducts,
	} = useProductStore();

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Safe getters with error handling
	const totalStock = (() => {
		try {
			return getTotalStock() || 0;
		} catch (err) {
			console.error('Error getting total stock:', err);
			return 0;
		}
	})();

	const lowStockItems = (() => {
		try {
			return getLowStockItems() || 0;
		} catch (err) {
			console.error('Error getting low stock items:', err);
			return 0;
		}
	})();

	const totalValue = (() => {
		try {
			return getTotalValue() || 0;
		} catch (err) {
			console.error('Error getting total value:', err);
			return 0;
		}
	})();

	const getStockStatus = (
		current: number | undefined,
		min: number | undefined
	) => {
		try {
			const currentStock = safeParseInt(current, 0);
			const minStock = safeParseInt(min, 0);

			if (currentStock <= minStock * 0.5) {
				return {
					text: 'Stok Habis',
					color: 'bg-red-100 text-red-800',
					icon: AlertTriangle,
				};
			}
			if (currentStock <= minStock) {
				return {
					text: 'Segera Restock',
					color: 'bg-yellow-100 text-yellow-800',
					icon: AlertTriangle,
				};
			}
			if (currentStock <= minStock * 1.5) {
				return {
					text: 'Perlu Perhatian',
					color: 'bg-orange-100 text-orange-800',
					icon: Package,
				};
			}
			return {
				text: 'Stok Aman',
				color: 'bg-green-100 text-green-800',
				icon: Package,
			};
		} catch (err) {
			console.error('Error getting stock status:', err);
			return {
				text: 'Unknown',
				color: 'bg-gray-100 text-gray-800',
				icon: Package,
			};
		}
	};

	const handleRefresh = async () => {
		try {
			clearError();
			await fetchProducts();
		} catch (err) {
			console.error('Error refreshing:', err);
		}
	};

	const handleUpdateStock = async (
		productId: number,
		type: 'addition' | 'reduction'
	) => {
		await updateStock(productId, 1, type);
	};

	// Update the safeProducts array to handle loading state
	const safeProducts = Array.isArray(products) ? products : [];

	// Add loading state check before the main return
	if (isLoading && safeProducts.length === 0) {
		return (
			<div className='p-6 space-y-6'>
				<div className='space-y-2'>
					<div className='h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse mx-auto' />
					<div className='h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse mx-auto' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className='h-32 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl animate-pulse'
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className='p-4 sm:p-6 space-y-8 animate-fade-in'>
			{/* Error Banner */}
			{error && (
				<div className='bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<AlertTriangle className='h-5 w-5 text-red-500' />
						<span className='text-red-700'>
							{safeString(error)}
						</span>
					</div>
					<Button
						onClick={handleRefresh}
						size='sm'
						variant='outline'
						className='border-red-200 text-red-600 hover:bg-red-50 bg-transparent'
					>
						<RefreshCw className='h-4 w-4 mr-2' />
						Coba Lagi
					</Button>
				</div>
			)}

			{/* Database Setup Banner */}
			<DatabaseSetupBanner />

			{/* Header */}
			<div className='text-center space-y-2'>
				<h1 className='text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent'>
					Dashboard
				</h1>
				<div className='flex flex-col sm:flex-row justify-center gap-3'>
					<Button
						onClick={handleRefresh}
						size='sm'
						variant='outline'
						className='border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full bg-transparent'
						disabled={isLoading}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${
								isLoading ? 'animate-spin' : ''
							}`}
						/>
						Refresh Data
					</Button>

					<AddProductModal
						trigger={
							<Button className='cotton-candy-button from-purple-400 to-indigo-400 rounded-full px-6'>
								<Plus className='h-4 w-4 mr-2' />
								Tambah Produk
							</Button>
						}
					/>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
							<Package className='h-4 w-4 text-pink-500' />
							Total Kue dalam Stok
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent'>
							{totalStock}
						</div>
						<p className='text-xs text-gray-500 mt-1'>
							Semua produk
						</p>
					</CardContent>
				</Card>

				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
							<AlertTriangle className='h-4 w-4 text-yellow-500' />
							Item Stok Rendah
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent'>
							{lowStockItems}
						</div>
						<p className='text-xs text-gray-500 mt-1'>
							Perlu perhatian
						</p>
					</CardContent>
				</Card>

				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium text-gray-600 flex items-center gap-2'>
							<TrendingUp className='h-4 w-4 text-green-500' />
							Total Nilai Stok
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent'>
							{formatCurrency(totalValue)}
						</div>
						<p className='text-xs text-gray-500 mt-1'>
							Nilai keseluruhan
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Stock Alert Table */}
			<Card className='cotton-candy-card rounded-2xl border-0 shadow-lg'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle className='text-xl font-bold text-gray-800 flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5 text-yellow-500' />
							Status Inventaris
						</CardTitle>
						<div className='text-sm text-gray-500'>
							{safeProducts.length} produk terdaftar
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{!safeProducts || safeProducts.length === 0 ? (
						<div className='text-center py-12'>
							<Package className='h-12 w-12 mx-auto mb-4 text-gray-300' />
							<p className='text-gray-500 mb-4'>
								Belum ada produk. Tambahkan produk pertama Anda!
							</p>
							<AddProductModal
								trigger={
									<Button className='cotton-candy-button from-purple-400 to-indigo-400 rounded-full px-6'>
										<Plus className='h-4 w-4 mr-2' />
										Tambah Produk Pertama
									</Button>
								}
							/>
						</div>
					) : (
						<div className='overflow-x-auto md:overflow-x-visible'>
							<table className='w-full'>
								<thead>
									<tr className='border-b border-pink-100'>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Produk
										</th>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Stok Saat Ini
										</th>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Stok Minimum
										</th>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Status
										</th>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Nilai
										</th>
										<th className='text-left py-4 px-4 font-medium text-gray-600'>
											Aksi
										</th>
									</tr>
								</thead>
								<tbody>
									{safeProducts.map((item: Product) => {
										try {
											const status = getStockStatus(
												item.current_stock,
												item.min_stock
											);
											const StatusIcon = status.icon;

											return (
												<tr
													key={item.id}
													className='border-b border-pink-50 hover:bg-pink-25 transition-colors'
												>
													<td className='py-4 px-4 font-medium text-gray-900'>
														{safeString(item.name)}
													</td>
													<td className='py-4 px-4 text-gray-600 font-semibold'>
														{safeParseInt(
															item.current_stock,
															0
														)}
													</td>
													<td className='py-4 px-4 text-gray-600'>
														{safeParseInt(
															item.min_stock,
															0
														)}
													</td>
													<td className='py-4 px-4'>
														<Badge
															className={`${status.color} border-0 flex items-center gap-1 w-fit`}
														>
															<StatusIcon className='h-3 w-3' />
															{status.text}
														</Badge>
													</td>
													<td className='py-4 px-4 font-medium text-gray-900'>
														{formatCurrency(
															item.total_value
														)}
													</td>
													<td className='py-4 px-4'>
														<div className='flex items-center gap-2'>
															<Button
																size='sm'
																className='cotton-candy-button from-green-400 to-emerald-400 rounded-full px-3'
																onClick={() =>
																	handleUpdateStock(
																		item.id,
																		'addition'
																	)
																}
																disabled={
																	isLoading
																}
																title='Tambah Stok'
															>
																<Plus className='h-3 w-3' />
															</Button>
															<Button
																size='sm'
																className='cotton-candy-button from-blue-400 to-cyan-400 rounded-full px-3'
																onClick={() =>
																	handleUpdateStock(
																		item.id,
																		'reduction'
																	)
																}
																disabled={
																	isLoading
																}
																title='Kurangi Stok'
															>
																<Minus className='h-3 w-3' />
															</Button>
															<EditProductModal
																product={item}
																trigger={
																	<Button
																		size='sm'
																		className='cotton-candy-button from-purple-400 to-indigo-400 rounded-full px-3'
																		title='Edit Produk'
																	>
																		<Edit className='h-3 w-3' />
																	</Button>
																}
															/>
															<DeleteProductModal
																productId={
																	item.id
																}
																productName={
																	item.name
																}
																trigger={
																	<Button
																		size='sm'
																		variant='outline'
																		className='border-red-200 text-red-500 hover:bg-red-50 rounded-full px-3 bg-transparent'
																		title='Hapus Produk'
																	>
																		<Trash2 className='h-3 w-3' />
																	</Button>
																}
															/>
														</div>
													</td>
												</tr>
											);
										} catch (error) {
											console.error(
												'Error rendering product row:',
												error
											);
											return (
												<tr
													key={
														item.id || Math.random()
													}
													className='border-b border-pink-50'
												>
													<td
														colSpan={6}
														className='py-4 px-4 text-red-500 text-center'
													>
														Error loading product
														data
													</td>
												</tr>
											);
										}
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
