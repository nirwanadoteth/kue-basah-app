'use client';

import type React from 'react';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingFallback } from '@/components/loading-fallback';

interface AuthGuardProps {
	children: React.ReactNode;
}

/**
 * Protects child components by enforcing authentication, redirecting unauthenticated users to the login page.
 *
 * Renders a loading fallback while authentication status is being determined or when redirecting unauthenticated users.
 *
 * @param children - The components to render if the user is authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading && !isAuthenticated && pathname !== '/login') {
			router.push('/login');
		}
	}, [isAuthenticated, isLoading, router, pathname]);

	if (isLoading || (!isAuthenticated && pathname !== '/login')) {
		return <LoadingFallback />;
	}

	return <>{children}</>;
}
