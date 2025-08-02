'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthService, type AuthState } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType extends AuthState {
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
	});

	const router = useRouter();

	const refreshUser = useCallback(async () => {
		try {
			setAuthState((prev) => ({ ...prev, isLoading: true }));
			const user = await AuthService.getCurrentUser();
			setAuthState({
				user,
				isAuthenticated: !!user,
				isLoading: false,
			});
		} catch (error) {
			console.error('Failed to refresh user:', error);
			setAuthState({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	}, []);

	useEffect(() => {
		refreshUser();
	}, [refreshUser]);

	const login = async (username: string, password: string) => {
		try {
			setAuthState((prev) => ({ ...prev, isLoading: true }));

			const user = await AuthService.login(username, password);

			setAuthState({
				user,
				isAuthenticated: true,
				isLoading: false,
			});

			router.push('/');
		} catch (error) {
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			throw error;
		}
	};

	const logout = async () => {
		await AuthService.logout();
		setAuthState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});
		router.push('/login');
	};

	return (
		<AuthContext.Provider
			value={{
				...authState,
				login,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
