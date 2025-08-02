'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LoginForm from '@/components/login-form';
import { LoadingFallback } from '@/components/loading-fallback';

/**
 * Renders the login page, redirecting authenticated users to the home page and displaying a loading indicator while authentication status is being determined.
 *
 * Displays the login form only if the user is not authenticated and authentication status has finished loading.
 */
export default function LoginPage() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// If already authenticated, redirect to dashboard
		if (!isLoading && isAuthenticated) {
			router.push('/');
		}
	}, [isAuthenticated, isLoading, router]);

	// Show loading while checking authentication
	if (isLoading) {
		return <LoadingFallback />;
	}

	// If already authenticated, don't show login form
	if (isAuthenticated) {
		return <LoadingFallback />;
	}

	return <LoginForm />;
}
