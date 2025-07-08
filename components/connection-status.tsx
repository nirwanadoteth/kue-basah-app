"use client"

import { useEffect, useState } from "react"
import { testSupabaseConnection, checkTablesExist } from "@/lib/supabase"
import { WifiOff, Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ConnectionState {
  isConnected: boolean | null
  tablesExist: boolean | null
  isChecking: boolean
  error?: string
}

export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>({
    isConnected: null,
    tablesExist: null,
    isChecking: false,
  })

  const checkConnection = async () => {
    setState((prev) => ({ ...prev, isChecking: true }))

    try {
      // Test basic connection
      const connected = await testSupabaseConnection()

      if (connected) {
        // Check if tables exist
        const { allTablesExist } = await checkTablesExist()
        setState({
          isConnected: true,
          tablesExist: allTablesExist,
          isChecking: false,
        })
      } else {
        setState({
          isConnected: false,
          tablesExist: null,
          isChecking: false,
          error: "Cannot connect to Supabase",
        })
      }
    } catch (error) {
      console.error("Connection check failed:", error)
      setState({
        isConnected: false,
        tablesExist: null,
        isChecking: false,
        error: error instanceof Error ? error.message : "Connection failed",
      })
    }
  }

  useEffect(() => {
    checkConnection()

    // Check connection every 60 seconds
    const interval = setInterval(checkConnection, 60000)

    return () => clearInterval(interval)
  }, [])

  // Don't show anything while initial check or if everything is working
  if (state.isConnected === null || (state.isConnected && state.tablesExist)) {
    return null
  }

  // Show connection issues
  if (!state.isConnected) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 bg-red-50 border-red-200 shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <WifiOff className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Connection Issue</p>
              <p className="text-xs text-red-600 mt-1">{state.error || "Cannot connect to Supabase database"}</p>
              <Button
                onClick={checkConnection}
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                disabled={state.isChecking}
              >
                {state.isChecking ? "Checking..." : "Retry"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show database setup needed
  if (state.isConnected && state.tablesExist === false) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 bg-yellow-50 border-yellow-200 shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Database Setup Needed</p>
              <p className="text-xs text-yellow-600 mt-1">Tables need to be created in Supabase</p>
              <Button
                onClick={checkConnection}
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs border-yellow-200 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                disabled={state.isChecking}
              >
                {state.isChecking ? "Checking..." : "Recheck"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
