import Supabase from '@/lib/supabase'
import type { DailyReport } from '@/lib/types'

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

export class DailyReportsAPI {
  static async getAll(limit = 30): Promise<DailyReport[]> {
    const { data, error } = await Supabase()
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(limit)

    if (error) handleSupabaseError(error, 'Failed to fetch daily reports')
    return data || []
  }

  static async getByDate(date: string): Promise<DailyReport | null> {
    const { data, error } = await Supabase()
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
    const { data, error } = await Supabase()
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
      Supabase()
        .from('daily_reports')
        .select('report_date, total_stock, total_value')
        .order('report_date', { ascending: true })
        .limit(30), // Pagination for performance
      Supabase()
        .from('products')
        .select('name, current_stock, total_value')
        .order('current_stock', { ascending: false })
        .limit(10), // Top 10 for performance
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

  static async generateCurrentReport(): Promise<DailyReport | null> {
    const { error } = await Supabase().rpc('update_daily_report')

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
