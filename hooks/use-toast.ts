'use client'

// Modern toast implementation using Sonner
// This replaces the old Radix UI toast implementation for better UX
import { toast as sonnerToast } from 'sonner'

// Export the toast function directly
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}

// Legacy compatibility hook
export const useToast = () => ({ toast })
