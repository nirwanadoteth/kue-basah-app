'use client'

import { create } from 'zustand'
import { ReportsAPI } from '@/lib/api/reports'
import type {
  DailyReport,
  WeeklyReportData,
  MonthlyReportData,
} from '@/lib/types'
import { toast } from 'sonner'

interface ReportStore {
  // State
  dailyReports: DailyReport[]
  weeklyReports: WeeklyReportData | null
  monthlyReports: MonthlyReportData | null
  isLoading: boolean
  error: string | null
  needsSetup: boolean

  // Actions
  fetchReports: () => Promise<void>
  fetchWeeklyReports: () => Promise<void>
  fetchMonthlyReports: () => Promise<void>

  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setNeedsSetup: (needsSetup: boolean) => void
  clearError: () => void
}

export const useReportStore = create<ReportStore>()((set) => ({
  // Initial state
  dailyReports: [],
  weeklyReports: null,
  monthlyReports: null,
  isLoading: false,
  error: null,
  needsSetup: false,

  // Fetch data
  fetchReports: async () => {
    try {
      set({ isLoading: true, error: null, needsSetup: false })
      const dailyReports = await ReportsAPI.getDailyReports()
      set({ dailyReports, isLoading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch reports'
      const isSetupError =
        errorMessage.includes('Database tables not found') ||
        errorMessage.includes('relation "public.daily_reports" does not exist')
      set({
        error: isSetupError ? 'Database setup required' : errorMessage,
        isLoading: false,
        needsSetup: isSetupError,
      })
      if (!isSetupError) toast.error(errorMessage)
      throw error
    }
  },

  fetchWeeklyReports: async () => {
    try {
      set({ isLoading: true, error: null })
      const weeklyReports = await ReportsAPI.getWeeklyReports()
      set({ weeklyReports, isLoading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch weekly reports'
      set({ error: errorMessage, isLoading: false })
      toast.error(errorMessage)
      throw error
    }
  },

  fetchMonthlyReports: async () => {
    try {
      set({ isLoading: true, error: null })
      const monthlyReports = await ReportsAPI.getMonthlyReports()
      set({ monthlyReports, isLoading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch monthly reports'
      set({ error: errorMessage, isLoading: false })
      toast.error(errorMessage)
      throw error
    }
  },

  // Utility
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setNeedsSetup: (needsSetup) => set({ needsSetup }),
  clearError: () => set({ error: null }),
}))
