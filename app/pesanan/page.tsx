'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TransactionsAPI } from '@/lib/api/transactions';
import { CreateTransactionModal } from '@/components/create-transaction-modal';
import { ViewTransactionModal } from '@/components/view-transaction-modal';
import { TableSkeleton } from '@/components/loading-skeleton';
import {
	Search,
	ShoppingCart,
	TrendingUp,
	Plus,
	Eye,
	Sparkles,
	RefreshCw,
	User,
	Calendar,
	DollarSign,
} from 'lucide-react';
import type { TransactionWithDetails } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { DatabaseSetupBanner } from '@/components/database-setup-banner';

/**
 * Displays the transactions management page, allowing users to view, filter, and manage transaction records with statistics, search, date filters, and modals for creating and viewing transaction details.
 *
 * Provides real-time statistics, error handling, and user notifications. Supports refreshing data, searching by transaction ID or admin username, and filtering by date range. Integrates modals for creating new transactions and viewing transaction details.
 *
 * @returns The rendered transactions management page component.
 */
export default function TransactionsPage() {
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [dateFilter, setDateFilter] = useState('all');
	const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
		[]
	);
	const [filteredTransactions, setFilteredTransactions] = useState<
		TransactionWithDetails[]
	>([]);
	const [stats, setStats] = useState({
		totalTransactions: 0,
		totalRevenue: 0,
		todayRevenue: 0,
		averageOrderValue: 0,
	});
	const [error, setError] = useState<string | null>(null);
	const [selectedTransactionId, setSelectedTransactionId] = useState<
		number | null
	>(null);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);

	const handleViewDetails = (transactionId: number) => {
		setSelectedTransactionId(transactionId);
		setIsViewModalOpen(true);
	};

	const handleViewModalClose = () => {
		setIsViewModalOpen(false);
		setSelectedTransactionId(null);
	};

	const loadTransactions = useCallback(async () => {
		try {
			const transactionsData = await TransactionsAPI.getAll();
			setTransactions(transactionsData);
		} catch (error) {
			console.error('Error loading transactions:', error);
			throw error;
		}
	}, []);

	const loadStats = useCallback(async () => {
		try {
			const statsData = await TransactionsAPI.getStats();
			setStats(statsData);
		} catch (error) {
			console.error('Error loading stats:', error);
			// Don't throw here, stats are not critical
		}
	}, []);

	const initializeData = useCallback(async () => {
		try {
			setIsInitialLoading(true);
			setError(null);
			await Promise.all([loadTransactions(), loadStats()]);
		} catch (error) {
			console.error('Failed to initialize data:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Gagal memuat data';
			setError(errorMessage);
		} finally {
			setIsInitialLoading(false);
		}
	}, [loadTransactions, loadStats]);

	const filterTransactions = useCallback(() => {
		let filtered = transactions;

		// Apply search filter by transaction ID, or admin name
		if (searchTerm && searchTerm.trim()) {
			const searchLower = searchTerm.toLowerCase();
			filtered = transactions.filter(
				(transaction) =>
					transaction.id.toString().includes(searchLower) ||
					transaction.users?.username
						?.toLowerCase()
						.includes(searchLower)
			);
		}

		// Apply date filter
		if (dateFilter !== 'all') {
			const today = new Date();
			const filterDate = new Date();

			try {
				switch (dateFilter) {
					case 'today':
						filterDate.setHours(0, 0, 0, 0);
						filtered = filtered.filter(
							(t: TransactionWithDetails) => {
								const transactionDate = new Date(t.created_at);
								return transactionDate >= filterDate;
							}
						);
						break;
					case 'week':
						filterDate.setDate(today.getDate() - 7);
						filtered = filtered.filter(
							(t: TransactionWithDetails) => {
								const transactionDate = new Date(t.created_at);
								return transactionDate >= filterDate;
							}
						);
						break;
					case 'month':
						filterDate.setMonth(today.getMonth() - 1);
						filtered = filtered.filter(
							(t: TransactionWithDetails) => {
								const transactionDate = new Date(t.created_at);
								return transactionDate >= filterDate;
							}
						);
						break;
				}
			} catch (error) {
				console.error('Date filtering error:', error);
			}
		}

		setFilteredTransactions(filtered);
	}, [transactions, searchTerm, dateFilter]);

	useEffect(() => {
		initializeData();
	}, [initializeData]);

	useEffect(() => {
		filterTransactions();
	}, [filterTransactions]);

	const handleRefresh = async () => {
		setIsLoading(true);
		setError(null);
		try {
			await Promise.all([loadTransactions(), loadStats()]);
			toast.success('Data berhasil diperbarui');
		} catch (error) {
			console.error('Failed to refresh data:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Gagal memperbarui data';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTransactionCreated = (transactionId: number) => {
		loadTransactions();
		loadStats();
		setSelectedTransactionId(transactionId);
	};

	const handleTransactionUpdated = () => {
		loadTransactions();
		loadStats();
	};

	if (isInitialLoading) {
		return (
			<div className='p-6 space-y-6'>
				<div className='space-y-2'>
					<div className='h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse' />
					<div className='h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className='h-24 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl animate-pulse'
						/>
					))}
				</div>
				<TableSkeleton />
			</div>
		);
	}

	return (
		<div className='p-6 space-y-8 animate-fade-in'>
			{/* Error Banner */}
			{error && (
				<div className='bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<ShoppingCart className='h-5 w-5 text-red-500' />
						<span className='text-red-700'>{error}</span>
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
			<div className='flex flex-col md:flex-row items-center justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2'>
						<ShoppingCart className='h-8 w-8 text-pink-500' />
						Pesanan & Transaksi
					</h1>
					<p className='text-gray-600 mt-1 flex items-center gap-2'>
						<Sparkles className='h-4 w-4 text-purple-400' />
						Kelola pesanan pelanggan dan transaksi penjualan cepat
					</p>
				</div>

				<div className='flex flex-col sm:flex-row gap-3'>
					<Button
						onClick={handleRefresh}
						variant='outline'
						className='border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-4 bg-transparent'
						disabled={isLoading}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${
								isLoading ? 'animate-spin' : ''
							}`}
						/>
						Refresh
					</Button>

					<CreateTransactionModal
						trigger={
							<Button className='cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6'>
								<Plus className='h-4 w-4 mr-2' />
								Buat Pesanan
							</Button>
						}
						onTransactionCreated={handleTransactionCreated}
						onTransactionUpdated={handleTransactionUpdated}
						isOrder={true}
					/>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300'>
					<CardContent className='p-4 text-center'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<ShoppingCart className='h-5 w-5 text-blue-500' />
							<span className='text-sm font-medium text-gray-600'>
								Total Transaksi
							</span>
						</div>
						<div className='text-2xl font-bold text-blue-500'>
							{stats.totalTransactions}
						</div>
					</CardContent>
				</Card>

				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300'>
					<CardContent className='p-4 text-center'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<TrendingUp className='h-5 w-5 text-purple-500' />
							<span className='text-sm font-medium text-gray-600'>
								Total Pendapatan
							</span>
						</div>
						<div className='text-lg font-bold text-purple-500'>
							{formatCurrency(stats.totalRevenue)}
						</div>
					</CardContent>
				</Card>

				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300'>
					<CardContent className='p-4 text-center'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<Calendar className='h-5 w-5 text-indigo-500' />
							<span className='text-sm font-medium text-gray-600'>
								Pendapatan Hari Ini
							</span>
						</div>
						<div className='text-lg font-bold text-indigo-500'>
							{formatCurrency(stats.todayRevenue)}
						</div>
					</CardContent>
				</Card>

				<Card className='cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300'>
					<CardContent className='p-4 text-center'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<DollarSign className='h-5 w-5 text-green-500' />
							<span className='text-sm font-medium text-gray-600'>
								Rata-rata/Pesanan
							</span>
						</div>
						<div className='text-lg font-bold text-green-500'>
							{formatCurrency(stats.averageOrderValue)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className='flex flex-col sm:flex-row gap-4'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
					<Input
						placeholder='Cari (ID, nama admin)...'
						className='pl-10 border-pink-200 focus:border-pink-400 rounded-full'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<select
					value={dateFilter}
					onChange={(e) => setDateFilter(e.target.value)}
					className='px-4 py-2 border border-pink-200 rounded-full focus:border-pink-400 focus:outline-none bg-white'
				>
					<option value='all'>Semua Tanggal</option>
					<option value='today'>Hari Ini</option>
					<option value='week'>7 Hari Terakhir</option>
					<option value='month'>30 Hari Terakhir</option>
				</select>
			</div>

			{/* Transactions Table */}
			<Card className='cotton-candy-card rounded-2xl border-0 shadow-lg overflow-hidden'>
				<CardContent className='p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead className='bg-gradient-to-r from-pink-50 to-purple-50'>
								<tr>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										ID
									</th>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										Admin
									</th>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										Items
									</th>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										Total
									</th>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										Tanggal
									</th>
									<th className='text-left py-4 px-6 font-semibold text-gray-700'>
										Aksi
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredTransactions.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className='py-12 text-center text-gray-500'
										>
											<ShoppingCart className='h-12 w-12 mx-auto mb-4 text-gray-300' />
											{searchTerm || dateFilter !== 'all'
												? 'Tidak ada transaksi yang ditemukan'
												: 'Belum ada transaksi'}
										</td>
									</tr>
								) : (
									filteredTransactions.map((transaction) => (
										<tr
											key={transaction.id}
											className='border-b border-pink-50 hover:bg-gradient-to-r hover:from-pink-25 hover:to-purple-25 transition-all duration-200'
										>
											<td className='py-4 px-6 font-medium text-gray-900'>
												#{transaction.id}
											</td>
											<td className='py-4 px-6'>
												<div className='flex items-center gap-2'>
													<div className='w-8 h-8 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center'>
														<User className='h-4 w-4 text-pink-600' />
													</div>
													<span className='font-semibold text-gray-900'>
														{
															transaction.users
																?.username
														}
													</span>
												</div>
											</td>
											<td className='py-4 px-6 text-gray-600'>
												{transaction.details.length}{' '}
												item
											</td>
											<td className='py-4 px-6'>
												<div className='font-bold text-green-600'>
													{formatCurrency(
														transaction.total_price
													)}
												</div>
											</td>
											<td className='py-4 px-6 text-gray-600'>
												{formatDate(
													transaction.created_at
												)}
											</td>
											<td className='py-4 px-6'>
												<ViewTransactionModal
													trigger={
														<Button
															size='sm'
															className='cotton-candy-button from-blue-400 to-cyan-400 rounded-full px-3'
															title='Lihat Detail'
															onClick={() =>
																handleViewDetails(
																	transaction.id
																)
															}
														>
															<Eye className='h-3 w-3' />
														</Button>
													}
													transactionId={
														transaction.id
													}
													onClose={
														handleViewModalClose
													}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
