"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoadingFallback } from "@/components/loading-fallback";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if we're already on the login page
    if (pathname === "/login") {
      return;
    }

    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingFallback />;
  }

  // If on login page, always show children
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return <LoadingFallback />;
  }

  // If authenticated, render children
  return <>{children}</>;
}
