// Modular Reports API - Main Entry Point
// Combines all report modules with optimized performance and proper error handling
import { DailyReportsAPI } from '@/lib/api/reports/daily-reports'
import { WeeklyReportsAPI } from '@/lib/api/reports/weekly-reports'
import { MonthlyReportsAPI } from '@/lib/api/reports/monthly-reports'

// Legacy compatibility class that delegates to modular APIs
export class ReportsAPI {
  // Daily Reports
  static async getDailyReports(limit = 30) {
    return DailyReportsAPI.getAll(limit)
  }

  static async getByDate(date: string) {
    return DailyReportsAPI.getByDate(date)
  }

  static async getByDateRange(startDate: string, endDate: string) {
    return DailyReportsAPI.getByDateRange(startDate, endDate)
  }

  static async getAnalytics() {
    return DailyReportsAPI.getAnalytics()
  }

  static async generateCurrentReport() {
    return DailyReportsAPI.generateCurrentReport()
  }

  // Weekly Reports
  static async getWeeklyReports() {
    return WeeklyReportsAPI.getWeeklyReports()
  }

  // Monthly Reports
  static async getMonthlyReports() {
    return MonthlyReportsAPI.getMonthlyReports()
  }
}

// Re-export the individual APIs for direct use

export { DailyReportsAPI } from '@/lib/api/reports/daily-reports'
export { WeeklyReportsAPI } from '@/lib/api/reports/weekly-reports'
export { MonthlyReportsAPI } from '@/lib/api/reports/monthly-reports'
