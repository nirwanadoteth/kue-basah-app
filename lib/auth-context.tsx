"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AuthService, type AuthState } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const user = AuthService.getCurrentUser();
        const isAuthenticated = AuthService.isAuthenticated();

        setAuthState({
          user,
          isAuthenticated,
          isLoading: false,
        });
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    // Only run on client side
    if (typeof window !== "undefined") {
      initAuth();
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const user = await AuthService.login(username, password);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect to dashboard after successful login
      router.push("/");
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push("/login");
  };

  const refreshUser = () => {
    const user = AuthService.getCurrentUser();
    const isAuthenticated = AuthService.isAuthenticated();

    setAuthState((prev) => ({
      ...prev,
      user,
      isAuthenticated,
    }));
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
