import { createClient } from '@/lib/supabase/server'
import type { MonthlyReportData } from '@/lib/types'

interface MonthlyRpcData {
  month_number: number
  month_name: string
  total_sales: number
  total_value: number
  transaction_count: number
  revenue: number
}

interface ProductSalesData {
  totalSold: number
  revenue: number
}

export class MonthlyReportsAPI {
  static async getMonthlyReports(): Promise<MonthlyReportData> {
    try {
      const supabase = await createClient()
      // Try to use optimized database function first for maximum performance
      const { data, error } = await supabase.rpc('get_monthly_report_data', {
        p_months_back: 6,
      })

      if (!error && data && data.length > 0) {
        const monthlyData = data.map((item: MonthlyRpcData) => ({
          month: item.month_name || 'Unknown',
          totalSales: Number(item.total_sales) || 0,
          totalValue: Number(item.total_value) || 0,
          transactionCount: Number(item.transaction_count) || 0,
        }))

        const monthlyTrend = data.map((item: MonthlyRpcData) => ({
          month: item.month_name || 'Unknown',
          revenue: Number(item.revenue) || 0,
          profit: (Number(item.revenue) || 0) * 0.3, // 30% profit margin
        }))

        // Get top products efficiently with pagination
        const topProducts = await this.getTopProducts()

        return { monthlyData, monthlyTrend, topProducts }
      }

      console.warn(
        'Database function get_monthly_report_data not available, falling back',
      )
    } catch (error) {
      console.warn(
        'Error using monthly database function, falling back:',
        error,
      )
    }

    // Fallback implementation with optimized queries
    return this.getFallbackMonthlyReports()
  }

  private static async getTopProducts() {
    try {
      const supabase = await createClient()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      // Optimized query with pagination for performance
      const { data: topProductsData } = await supabase
        .from('transaction_details')
        .select('product_name, quantity, product_price')
        .gte('created_at', sixMonthsAgo.toISOString())
        .limit(1000) // Pagination to prevent large data transfer

      const productSales: Record<string, ProductSalesData> = {}

      topProductsData?.forEach((item) => {
        const productName = item.product_name || 'Unknown'
        if (!productSales[productName]) {
          productSales[productName] = { totalSold: 0, revenue: 0 }
        }
        productSales[productName].totalSold += item.quantity || 0
        productSales[productName].revenue +=
          (item.quantity || 0) * (item.product_price || 0)
      })

      return Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10 for performance
    } catch (error) {
      console.error('Error fetching top products:', error)
      return []
    }
  }

  private static async getFallbackMonthlyReports(): Promise<MonthlyReportData> {
    const supabase = await createClient()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Optimized queries with pagination for large datasets
    const [reportsResult, transactionsResult] = await Promise.allSettled([
      supabase
        .from('daily_reports')
        .select('report_date, total_value, total_stock')
        .gte('report_date', startDate)
        .lte('report_date', today)
        .order('report_date', { ascending: true })
        .limit(200), // Pagination for performance
      supabase
        .from('transactions')
        .select(
          `
        id, created_at, total_price,
        transaction_details(quantity, product_name, product_price)
      `,
        )
        .gte('created_at', startDate)
        .lte('created_at', today + 'T23:59:59')
        .order('created_at', { ascending: true })
        .limit(2000), // Reasonable limit for recent transactions
    ])

    if (reportsResult.status === 'rejected') {
      console.error('Error fetching monthly reports:', reportsResult.reason)
      return { monthlyData: [], monthlyTrend: [], topProducts: [] }
    }

    if (transactionsResult.status === 'rejected') {
      console.error(
        'Error fetching monthly transactions:',
        transactionsResult.reason,
      )
      return { monthlyData: [], monthlyTrend: [], topProducts: [] }
    }

    const reports = reportsResult.value.data || []
    const transactions = transactionsResult.value.data || []

    // Efficient client-side aggregation
    const monthlyData = []
    const monthlyTrend = []
    const productSales: Record<string, ProductSalesData> = {}

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(sixMonthsAgo)
      monthStart.setMonth(monthStart.getMonth() + i)
      monthStart.setDate(1)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)

      const monthStartStr = monthStart.toISOString().split('T')[0]
      const monthEndStr = monthEnd.toISOString().split('T')[0]

      // Efficient filtering with optimized date comparison
      const monthReports = reports.filter(
        (report) =>
          report.report_date >= monthStartStr &&
          report.report_date <= monthEndStr,
      )

      const monthTransactions = transactions.filter((transaction) => {
        const transDate = transaction.created_at.split('T')[0]
        return transDate >= monthStartStr && transDate <= monthEndStr
      })

      const totalValue = monthReports.reduce(
        (sum, report) => sum + (report.total_value || 0),
        0,
      )
      const totalSales = monthTransactions.reduce(
        (sum, transaction) =>
          sum +
          (transaction.transaction_details?.reduce(
            (itemSum: number, item: { quantity?: number }) =>
              itemSum + (item.quantity || 0),
            0,
          ) || 0),
        0,
      )

      const revenue = monthTransactions.reduce(
        (sum, transaction) => sum + (transaction.total_price || 0),
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
        profit: revenue * 0.3, // 30% profit margin assumption
      })

      // Efficient product sales tracking
      monthTransactions.forEach((transaction) => {
        transaction.transaction_details?.forEach(
          (item: {
            product_name?: string
            quantity?: number
            product_price?: number
          }) => {
            const productName = item.product_name || 'Unknown'
            if (!productSales[productName]) {
              productSales[productName] = { totalSold: 0, revenue: 0 }
            }
            productSales[productName].totalSold += item.quantity || 0
            productSales[productName].revenue +=
              (item.quantity || 0) * (item.product_price || 0)
          },
        )
      })
    }

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 for performance

    return { monthlyData, monthlyTrend, topProducts }
  }
}
