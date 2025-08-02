import { supabase } from '@/lib/supabase'

export interface User {
  user_id: string
  email: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export class AuthService {
  // Login with email and password
  static async login(email: string, password: string): Promise<User> {
    try {
      if (!email || !password) {
        throw new Error('Email dan password wajib diisi')
      }

      // Call the authentication function with plain password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        console.error('Authentication error:', error)
        throw new Error('Gagal melakukan autentikasi')
      }

      if (!data.user) {
        throw new Error('Email atau password salah')
      }

      return { user_id: data.user.id, email: data.user.email! }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout
  static async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  // Get current user from Supabase session
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        if (userError) console.error('Error fetching user:', userError)
        return null
      }

      return { user_id: user.id, email: user.email! }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return !!user
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error('Get users error:', error)
        throw new Error('Gagal mengambil data pengguna')
      }

      return data.users.map((user) => ({
        user_id: user.id,
        email: user.email!,
      }))
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  }
}
