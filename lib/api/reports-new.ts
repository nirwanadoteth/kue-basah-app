// Main Reports API - Now delegates to modular implementations
// This file maintains backward compatibility while leveraging optimized modular structure

export {
  DailyReportsAPI,
  WeeklyReportsAPI,
  MonthlyReportsAPI,
} from '@/lib/api/reports/index'

// Re-export the main ReportsAPI for backward compatibility
export { ReportsAPI } from '@/lib/api/reports/index'

// Re-export types for convenience
export type {
  DailyReport,
  WeeklyReportData,
  MonthlyReportData,
} from '@/lib/types'
