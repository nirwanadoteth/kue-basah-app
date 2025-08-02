import { supabase } from '@/lib/supabase';

export interface User {
	user_id: number;
	username: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export class AuthService {
	// Login with username and password
	static async login(username: string, password: string): Promise<User> {
		try {
			if (!username || !password) {
				throw new Error('Username dan password wajib diisi');
			}

			// Call the authentication function with plain password
			const { data, error } = await supabase.auth.signInWithPassword({
				email: username.trim().toLowerCase(),
				password,
			});

			if (error) {
				console.error('Authentication error:', error);
				throw new Error('Gagal melakukan autentikasi');
			}

			if (!data || data.length === 0) {
				throw new Error('Username atau password salah');
			}

			const user = data[0];

			// Store user data in localStorage
			if (typeof window !== 'undefined') {
				localStorage.setItem('auth_user', JSON.stringify(user));
				localStorage.setItem(
					'auth_token',
					`${user.username}_${Date.now()}`
				);
			}

			return user;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	}

	// Logout
	static logout(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('auth_user');
			localStorage.removeItem('auth_token');
		}
	}

	// Get current user from localStorage
	static getCurrentUser(): User | null {
		try {
			if (typeof window === 'undefined') return null;

			const userStr = localStorage.getItem('auth_user');
			const token = localStorage.getItem('auth_token');

			if (!userStr || !token) {
				return null;
			}

			return JSON.parse(userStr);
		} catch (error) {
			console.error('Error getting current user:', error);
			return null;
		}
	}

	// Check if user is authenticated
	static isAuthenticated(): boolean {
		if (typeof window === 'undefined') return false;

		const user = this.getCurrentUser();
		const token = localStorage.getItem('auth_token');
		return !!(user && token);
	}

	// Get all users (admin only)
	static async getAllUsers(): Promise<User[]> {
		try {
			const { data, error } = await supabase
				.from('users')
				.select('user_id:id, username')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Get users error:', error);
				throw new Error('Gagal mengambil data pengguna');
			}

			return data || [];
		} catch (error) {
			console.error('Get all users error:', error);
			throw error;
		}
	}
}
