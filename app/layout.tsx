import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ConnectionStatus } from '@/components/connection-status';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: "NAY'S CAKE - Sweet Inventory Management",
	description:
		'Sistem manajemen inventaris modern untuk toko kue basah dengan tema cotton candy yang manis',
	generator: 'v0.dev',
};

/**
 * Defines the root layout for the application, providing global context, error boundaries, authentication, and shared UI components.
 *
 * Wraps all pages with authentication, error handling, navigation, footer, connection status, and toast notifications.
 *
 * @param children - The page content to render within the layout
 */
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='id'>
			<body className={inter.className}>
				<ErrorBoundary>
					<AuthProvider>
						<AuthGuard>
							<div className='min-h-screen'>
								<Navbar />
								<main>{children}</main>
								<Footer />
								<ConnectionStatus />
							</div>
						</AuthGuard>
						<Toaster position='top-right' />
					</AuthProvider>
				</ErrorBoundary>
				<SpeedInsights />
			</body>
		</html>
	);
}
