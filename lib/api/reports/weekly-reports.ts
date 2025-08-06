import { supabase } from '@/lib/supabase'
import type { WeeklyReportData } from '@/lib/types'

interface WeeklyRpcData {
  week_number: number
  week_start: string
  total_sales: number
  total_value: number
  transaction_count: number
}

interface WeeklyProductData {
  product_name: string
  week1_sales: number
  week2_sales: number
  week3_sales: number
  week4_sales: number
}

export class WeeklyReportsAPI {
  static async getWeeklyReports(): Promise<WeeklyReportData> {
    try {
      // Try to use optimized database functions first
      const [weeklyDataResult, weeklyTrendsResult] = await Promise.allSettled([
        supabase.rpc('get_weekly_report_data', { p_weeks_back: 4 }),
        supabase.rpc('get_weekly_product_trends', { p_weeks_back: 4 }),
      ])

      let weeklyData: WeeklyReportData['weeklyData'] = []
      let weeklyProductTrend: WeeklyReportData['weeklyProductTrend'] = []

      // Process weekly data with proper typing
      if (
        weeklyDataResult.status === 'fulfilled' &&
        !weeklyDataResult.value.error
      ) {
        weeklyData = (weeklyDataResult.value.data || []).map(
          (item: WeeklyRpcData) => ({
            week: `Minggu ${item.week_number}`,
            totalSales: Number(item.total_sales) || 0,
            totalValue: Number(item.total_value) || 0,
            transactionCount: Number(item.transaction_count) || 0,
          }),
        )
      }

      // Process product trends with proper typing
      if (
        weeklyTrendsResult.status === 'fulfilled' &&
        !weeklyTrendsResult.value.error
      ) {
        weeklyProductTrend = (weeklyTrendsResult.value.data || []).map(
          (item: WeeklyProductData) => ({
            name: item.product_name || 'Unknown',
            week1: Number(item.week1_sales) || 0,
            week2: Number(item.week2_sales) || 0,
            week3: Number(item.week3_sales) || 0,
            week4: Number(item.week4_sales) || 0,
          }),
        )
      }

      // If database functions worked, return optimized results
      if (weeklyData.length > 0 || weeklyProductTrend.length > 0) {
        return { weeklyData, weeklyProductTrend }
      }

      console.warn(
        'Database functions not available, falling back to client-side processing',
      )
    } catch (error) {
      console.warn('Error using database functions, falling back:', error)
    }

    // Fallback implementation with pagination for performance
    return this.getFallbackWeeklyReports()
  }

  private static async getFallbackWeeklyReports(): Promise<WeeklyReportData> {
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    const startDate = fourWeeksAgo.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Use LIMIT for pagination - fetch only what we need for performance
    const [reportsResult, transactionsResult] = await Promise.allSettled([
      supabase
        .from('daily_reports')
        .select('report_date, total_value, total_stock')
        .gte('report_date', startDate)
        .lte('report_date', today)
        .order('report_date', { ascending: true })
        .limit(30), // Pagination to prevent large data transfer
      supabase
        .from('transactions')
        .select(
          `
          id, created_at, total_price,
          transaction_details(quantity, product_name)
        `,
        )
        .gte('created_at', startDate)
        .lte('created_at', today + 'T23:59:59')
        .order('created_at', { ascending: true })
        .limit(1000), // Reasonable limit for recent transactions
    ])

    const reports =
      reportsResult.status === 'fulfilled' ? reportsResult.value.data || [] : []
    const transactions =
      transactionsResult.status === 'fulfilled'
        ? transactionsResult.value.data || []
        : []

    // Client-side aggregation fallback
    const weeklyData = []
    const weeklyProductData: Record<string, Record<string, number>> = {}

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      // Filter with optimized date comparison
      const weekReports = reports.filter(
        (report) =>
          report.report_date >= weekStartStr &&
          report.report_date <= weekEndStr,
      )

      const weekTransactions = transactions.filter((transaction) => {
        const transDate = transaction.created_at.split('T')[0]
        return transDate >= weekStartStr && transDate <= weekEndStr
      })

      const totalValue = weekReports.reduce(
        (sum, report) => sum + (report.total_value || 0),
        0,
      )
      const totalSales = weekTransactions.reduce(
        (sum, transaction) =>
          sum +
          (transaction.transaction_details?.reduce(
            (itemSum: number, item: { quantity?: number }) =>
              itemSum + (item.quantity || 0),
            0,
          ) || 0),
        0,
      )

      weeklyData.push({
        week: `Minggu ${i + 1}`,
        totalSales,
        totalValue,
        transactionCount: weekTransactions.length,
      })

      // Track product trends efficiently
      weekTransactions.forEach((transaction) => {
        transaction.transaction_details?.forEach(
          (item: { product_name?: string; quantity?: number }) => {
            const productName = item.product_name || 'Unknown'
            if (!weeklyProductData[productName]) {
              weeklyProductData[productName] = {
                week1: 0,
                week2: 0,
                week3: 0,
                week4: 0,
              }
            }
            weeklyProductData[productName][
              `week${i + 1}` as keyof (typeof weeklyProductData)[string]
            ] += item.quantity || 0
          },
        )
      })
    }

    const weeklyProductTrend = Object.entries(weeklyProductData)
      .map(([name, data]) => ({
        name,
        week1: data.week1 || 0,
        week2: data.week2 || 0,
        week3: data.week3 || 0,
        week4: data.week4 || 0,
      }))
      .sort((a, b) => {
        const totalA = a.week1 + a.week2 + a.week3 + a.week4
        const totalB = b.week1 + b.week2 + b.week3 + b.week4
        return totalB - totalA
      })
      .slice(0, 10) // Top 10 for performance

    return { weeklyData, weeklyProductTrend }
  }
}
