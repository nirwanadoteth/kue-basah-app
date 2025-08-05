import { supabase } from '@/lib/supabase'
import type {
  DailyReport,
  WeeklyReportData,
  MonthlyReportData,
  TransactionItem,
} from '@/lib/types'

// Helper function to handle Supabase errors
function handleSupabaseError(error: Error, message: string): never {
  console.error(`Supabase error ${message}:`, error)
  if (
    error.message.includes('relation "public.daily_reports" does not exist')
  ) {
    throw new Error(
      'Database tables not found. Please run the setup script first.',
    )
  }
  throw new Error(`${message}: ${error.message}`)
}

export class ReportsAPI {
  static async getDailyReports(limit = 30): Promise<DailyReport[]> {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(limit)

    if (error) handleSupabaseError(error, 'Failed to fetch daily reports')
    return data || []
  }

  static async getByDate(date: string): Promise<DailyReport | null> {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('report_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Report not found
      }
      handleSupabaseError(error, 'Failed to fetch daily report')
    }
    return data
  }

  static async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<DailyReport[]> {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: false })

    if (error)
      handleSupabaseError(error, 'Failed to fetch reports by date range')
    return data || []
  }

  static async getAnalytics(): Promise<{
    stockTrend: Array<{ date: string; stock: number; value: number }>
    productDistribution: Array<{ name: string; stock: number; value: number }>
  }> {
    const [stockResult, productResult] = await Promise.allSettled([
      supabase
        .from('daily_reports')
        .select('report_date, total_stock, total_value')
        .order('report_date', { ascending: true })
        .limit(30),
      supabase
        .from('products')
        .select('name, current_stock, total_value')
        .order('current_stock', { ascending: false })
        .limit(10),
    ])

    let stockTrend: Array<{ date: string; stock: number; value: number }> = []
    let productDistribution: Array<{
      name: string
      stock: number
      value: number
    }> = []

    if (stockResult.status === 'fulfilled' && !stockResult.value.error) {
      stockTrend = (stockResult.value.data || []).map((item) => ({
        date: item.report_date,
        stock: item.total_stock,
        value: item.total_value,
      }))
    } else if (stockResult.status === 'rejected') {
      console.error('Error fetching stock data:', stockResult.reason)
    } else if (stockResult.status === 'fulfilled' && stockResult.value.error) {
      console.error(
        'Supabase error fetching stock data:',
        stockResult.value.error,
      )
    }

    if (productResult.status === 'fulfilled' && !productResult.value.error) {
      productDistribution = (productResult.value.data || []).map((item) => ({
        name:
          item.name.length > 10
            ? item.name.substring(0, 10) + '...'
            : item.name,
        stock: item.current_stock,
        value: item.total_value,
      }))
    } else if (productResult.status === 'rejected') {
      console.error('Error fetching product data:', productResult.reason)
    } else if (
      productResult.status === 'fulfilled' &&
      productResult.value.error
    ) {
      console.error(
        'Supabase error fetching product data:',
        productResult.value.error,
      )
    }

    return {
      stockTrend,
      productDistribution,
    }
  }

  static async getWeeklyReports(): Promise<WeeklyReportData> {
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    const startDate = fourWeeksAgo.toISOString().split('T')[0]

    const today = new Date().toISOString().split('T')[0]

    // Get daily reports for the last 4 weeks
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .gte('report_date', startDate)
      .lte('report_date', today)
      .order('report_date', { ascending: true })

    if (reportsError) {
      console.error('Error fetching weekly reports:', reportsError)
      return { weeklyData: [], weeklyProductTrend: [] }
    }

    // Get transactions for the last 4 weeks
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', new Date(today + 'T23:59:59.999Z').toISOString())

    if (transactionsError) {
      console.error('Error fetching weekly transactions:', transactionsError)
      return { weeklyData: [], weeklyProductTrend: [] }
    }

    // Group data by weeks
    const weeklyData = []
    const weeklyProductData: Record<string, Record<string, number>> = {}

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      // Filter reports for this week
      const weekReports =
        reports?.filter(
          (report) =>
            report.report_date >= weekStartStr &&
            report.report_date <= weekEndStr,
        ) || []

      // Filter transactions for this week
      const weekTransactions =
        transactions?.filter(
          (transaction) =>
            new Date(transaction.created_at) >= new Date(weekStartStr) &&
            new Date(transaction.created_at) <=
              new Date(weekEndStr + 'T23:59:59.999Z'),
        ) || []

      const totalValue = weekReports.reduce(
        (sum, report) => sum + (report.total_value || 0),
        0,
      )
      const totalSales = weekTransactions.reduce(
        (sum, transaction) =>
          sum +
          (transaction.transaction_items?.reduce(
            (itemSum: number, item: TransactionItem) =>
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

      // Track product trends
      weekTransactions.forEach((transaction) => {
        transaction.transaction_items?.forEach((item: TransactionItem) => {
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
        })
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
      .slice(0, 10) // Top 10 products

    return { weeklyData, weeklyProductTrend }
  }

  static async getMonthlyReports(): Promise<MonthlyReportData> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const today = new Date().toISOString().split('T')[0]

    // Get daily reports for the last 6 months
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .gte('report_date', startDate)
      .lte('report_date', today)
      .order('report_date', { ascending: true })

    if (reportsError) {
      console.error('Error fetching monthly reports:', reportsError)
      return { monthlyData: [], monthlyTrend: [], topProducts: [] }
    }

    // Get transactions for the last 6 months
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', today + 'T23:59:59')
    if (transactionsError) {
      console.error('Error fetching monthly transactions:', transactionsError)
      return { monthlyData: [], monthlyTrend: [], topProducts: [] }
    }

    // Group data by months
    const monthlyData = []
    const monthlyTrend = []
    const productSales: Record<string, { totalSold: number; revenue: number }> =
      {}

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(sixMonthsAgo)
      monthStart.setMonth(monthStart.getMonth() + i)
      monthStart.setDate(1)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)

      const monthStartStr = monthStart.toISOString().split('T')[0]
      const monthEndStr = monthEnd.toISOString().split('T')[0]

      // Filter reports for this month
      const monthReports =
        reports?.filter(
          (report) =>
            report.report_date >= monthStartStr &&
            report.report_date <= monthEndStr,
        ) || []

      // Filter transactions for this month
      const monthTransactions =
        transactions?.filter(
          (transaction) =>
            new Date(transaction.created_at) >= new Date(monthStartStr) &&
            new Date(transaction.created_at) <=
              new Date(monthEndStr + 'T23:59:59.999Z'),
        ) || []

      const totalValue = monthReports.reduce(
        (sum, report) => sum + (report.total_value || 0),
        0,
      )
      const totalSales = monthTransactions.reduce(
        (sum, transaction) =>
          sum +
          (transaction.transaction_items?.reduce(
            (itemSum: number, item: TransactionItem) =>
              itemSum + (item.quantity || 0),
            0,
          ) || 0),
        0,
      )

      const revenue = monthTransactions.reduce(
        (sum, transaction) => sum + (transaction.total || 0),
        0,
      )

      const monthName = monthStart.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })

      monthlyData.push({
        month: monthName,
        totalSales,
        totalValue,
        transactionCount: monthTransactions.length,
      })

      monthlyTrend.push({
        month: monthName,
        revenue,
        // TODO: Fetch actual profit margin from configuration or calculate based on costs
        profit: revenue * 0.3, // Assuming 30% profit margin
      })

      // Track product sales
      monthTransactions.forEach((transaction) => {
        transaction.transaction_items?.forEach((item: TransactionItem) => {
          const productName = item.product_name || 'Unknown'
          if (!productSales[productName]) {
            productSales[productName] = { totalSold: 0, revenue: 0 }
          }
          productSales[productName].totalSold += item.quantity || 0
          productSales[productName].revenue +=
            (item.quantity || 0) * (item.price || 0)
        })
      })
    }

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products by revenue

    return { monthlyData, monthlyTrend, topProducts }
  }

  static async generateCurrentReport(): Promise<DailyReport | null> {
    const { error } = await supabase.rpc('update_daily_report')

    if (error) {
      console.warn('Stored function update_daily_report not available:', error)
      // Try to get today's report anyway
      const today = new Date().toISOString().split('T')[0]
      return await this.getByDate(today)
    }

    // Get today's report
    const today = new Date().toISOString().split('T')[0]
    const todayReport = await this.getByDate(today)

    return todayReport
  }
}
