"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useInventoryStore } from "@/lib/store-supabase"
import { ReportsAPI } from "@/lib/api/reports"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, BarChart3, PieChartIcon, Sparkles, Calendar, RefreshCw, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DatabaseSetupBanner } from "@/components/database-setup-banner"

const COLORS = ["#FF6B9D", "#C44569", "#F8B500", "#6C5CE7", "#00CEC9"]

export default function Reports() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<{
    stockTrend: Array<{ date: string; stock: number; value: number }>
    productDistribution: Array<{ name: string; stock: number; value: number }>
    transactionTrend: Array<{ date: string; additions: number; reductions: number }>
  }>({
    stockTrend: [],
    productDistribution: [],
    transactionTrend: [],
  })

  const {
    products,
    transactions,
    isLoading,
    error,
    fetchProducts,
    fetchTransactions,
    getTotalStock,
    getTotalValue,
    clearError,
  } = useInventoryStore()

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchTransactions()])

        // Fetch analytics data
        const analytics = await ReportsAPI.getAnalytics()
        setAnalyticsData(analytics)
      } catch (error) {
        console.error("Failed to initialize data:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    initializeData()
  }, [fetchProducts, fetchTransactions])

  const handleRefresh = async () => {
    clearError()
    try {
      await Promise.all([fetchProducts(), fetchTransactions()])

      const analytics = await ReportsAPI.getAnalytics()
      setAnalyticsData(analytics)
    } catch (error) {
      console.error("Failed to refresh data:", error)
    }
  }

  const handleExportReport = () => {
    // Create CSV data
    const csvData = [
      ["Produk", "Stok Saat Ini", "Stok Minimum", "Harga", "Total Nilai"],
      ...products.map((product) => [
        product.name,
        product.current_stock.toString(),
        product.min_stock.toString(),
        product.price.toString(),
        product.total_value.toString(),
      ]),
    ]

    // Convert to CSV string
    const csvString = csvData.map((row) => row.join(",")).join("\n")

    // Create and download file
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `laporan-inventaris-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (isInitialLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl animate-pulse" />
          <div className="h-80 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Database Setup Banner */}
      <DatabaseSetupBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-pink-500" />
            Laporan Inventaris
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Analisis mendalam dan visualisasi data penjualan
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="border-green-200 text-green-600 hover:bg-green-50 rounded-full px-4 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-4 bg-transparent"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="harian" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-pink-200/50 rounded-full p-1">
          <TabsTrigger
            value="harian"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-purple-400 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Harian
          </TabsTrigger>
          <TabsTrigger
            value="mingguan"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-purple-400 data-[state=active]:text-white"
          >
            Mingguan
          </TabsTrigger>
          <TabsTrigger
            value="bulanan"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-purple-400 data-[state=active]:text-white"
          >
            Bulanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="harian" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">{getTotalStock()}</div>
                <div className="text-sm text-gray-600">Total Stok</div>
              </CardContent>
            </Card>

            <Card className="cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <PieChartIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-500">{products.length}</div>
                <div className="text-sm text-gray-600">Jenis Produk</div>
              </CardContent>
            </Card>

            <Card className="cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-pink-500">{transactions.length}</div>
                <div className="text-sm text-gray-600">Transaksi</div>
              </CardContent>
            </Card>

            <Card className="cotton-candy-card rounded-2xl border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-indigo-500">{formatCurrency(getTotalValue())}</div>
                <div className="text-sm text-gray-600">Total Nilai</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Chart */}
            <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-pink-500" />
                  Distribusi Stok Produk
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {getTotalStock()}
                  </span>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Live Data</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.productDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Bar dataKey="stock" fill="url(#stockGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B9D" />
                        <stop offset="100%" stopColor="#C44569" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Trend Chart */}
            <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Tren Transaksi
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    {transactions.length}
                  </span>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">30 Hari</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData.transactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Line
                      type="monotone"
                      dataKey="additions"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                      name="Penambahan"
                    />
                    <Line
                      type="monotone"
                      dataKey="reductions"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                      name="Pengurangan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart */}
          <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-indigo-500" />
                Komposisi Stok Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.productDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="stock"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.productDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {analyticsData.productDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-auto">{item.stock} pcs</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mingguan">
          <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Laporan Mingguan</h3>
              <p className="text-gray-500">Data laporan mingguan akan segera tersedia</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulanan">
          <Card className="cotton-candy-card rounded-2xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Laporan Bulanan</h3>
              <p className="text-gray-500">Data laporan bulanan akan segera tersedia</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-12 flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 text-pink-400" />
        ©2025 Nay's Cake. All rights reserved.
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>
    </div>
  )
}
