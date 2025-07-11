import { supabase, type DailyReport } from "@/lib/supabase";

export class ReportsAPI {
  // Get daily reports
  static async getDailyReports(limit = 30): Promise<DailyReport[]> {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Supabase error fetching daily reports:", error);
        throw new Error(`Failed to fetch daily reports: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in ReportsAPI.getDailyReports:", error);
      throw error;
    }
  }

  // Get report by date
  static async getByDate(date: string): Promise<DailyReport | null> {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", date)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Report not found
        }
        console.error("Supabase error fetching daily report:", error);
        throw new Error(`Failed to fetch daily report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in ReportsAPI.getByDate:", error);
      throw error;
    }
  }

  // Get reports by date range
  static async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<DailyReport[]> {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .order("report_date", { ascending: false });

      if (error) {
        console.error("Supabase error fetching reports by date range:", error);
        throw new Error(
          `Failed to fetch reports by date range: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error in ReportsAPI.getByDateRange:", error);
      throw error;
    }
  }

  // Get analytics data for charts
  static async getAnalytics(): Promise<{
    stockTrend: Array<{ date: string; stock: number; value: number }>;
    productDistribution: Array<{ name: string; stock: number; value: number }>;
  }> {
    try {
      // Get stock trend from daily reports
      const { data: stockData, error: stockError } = await supabase
        .from("daily_reports")
        .select("report_date, total_stock, total_value")
        .order("report_date", { ascending: true })
        .limit(30);

      if (stockError) {
        console.error("Error fetching stock data:", stockError);
      }

      // Get product distribution
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("name, current_stock, total_value")
        .order("current_stock", { ascending: false })
        .limit(10);

      if (productError) {
        console.error("Error fetching product data:", productError);
      }

      return {
        stockTrend: (stockData || []).map((item) => ({
          date: item.report_date,
          stock: item.total_stock,
          value: item.total_value,
        })),
        productDistribution: (productData || []).map((item) => ({
          name:
            item.name.length > 10
              ? item.name.substring(0, 10) + "..."
              : item.name,
          stock: item.current_stock,
          value: item.total_value,
        })),
      };
    } catch (error) {
      console.error("Error in ReportsAPI.getAnalytics:", error);
      // Return empty data instead of throwing
      return {
        stockTrend: [],
        productDistribution: [],
      };
    }
  }

  // Generate current report
  static async generateCurrentReport(): Promise<DailyReport | null> {
    try {
      const { data, error } = await supabase.rpc("update_daily_report");

      if (error) {
        console.warn(
          "Stored function update_daily_report not available:",
          error
        );
        // Try to get today's report anyway
        const today = new Date().toISOString().split("T")[0];
        return await this.getByDate(today);
      }

      // Get today's report
      const today = new Date().toISOString().split("T")[0];
      const todayReport = await this.getByDate(today);

      return todayReport;
    } catch (error) {
      console.error("Error in ReportsAPI.generateCurrentReport:", error);
      return null;
    }
  }
}
