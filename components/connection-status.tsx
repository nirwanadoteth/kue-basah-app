'use client'

import { useEffect, useState, useCallback } from 'react'
import { testSupabaseConnection, checkTablesExist } from '@/lib/supabase'
import { WifiOff, Database } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ConnectionState {
  isConnected: boolean | null
  tablesExist: boolean | null
  isChecking: boolean
  error?: string
}

interface StatusCardProps {
  icon: React.ReactNode
  title: string
  message: string
  buttonText: string
  onButtonClick: () => void
  isButtonDisabled: boolean
  cardClassNames: string
  buttonClassNames: string
  titleClassNames: string
  messageClassNames: string
}

/**
 * Displays a fixed-position status card with an icon, title, message, and action button.
 *
 * Used to present connection or setup status notifications, allowing users to trigger an action such as retrying or rechecking. Styling and content are customizable via props.
 */
function StatusCard({
  icon,
  title,
  message,
  buttonText,
  onButtonClick,
  isButtonDisabled,
  cardClassNames,
  buttonClassNames,
  titleClassNames,
  messageClassNames,
}: StatusCardProps) {
  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 max-w-sm shadow-lg ${cardClassNames}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          {icon}
          <div className='flex-1'>
            <p className={`text-sm font-medium ${titleClassNames}`}>{title}</p>
            <p className={`mt-1 text-xs ${messageClassNames}`}>{message}</p>
            <Button
              onClick={onButtonClick}
              size='sm'
              variant='outline'
              className={`mt-2 h-7 bg-transparent text-xs ${buttonClassNames}`}
              disabled={isButtonDisabled}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * React component that monitors and displays the status of the Supabase database connection and required table existence.
 *
 * Renders a status card with error or setup messages if the connection fails or required tables are missing. Automatically checks the connection on mount and every 60 seconds, and allows manual rechecking via a button. Returns `null` if the connection and tables are healthy.
 */
export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>({
    isConnected: null,
    tablesExist: null,
    isChecking: false,
  })

  const checkConnection = useCallback(async () => {
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
          error: 'Cannot connect to Supabase',
        })
      }
    } catch (error) {
      console.error('Connection check failed:', error)
      setState({
        isConnected: false,
        tablesExist: null,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      })
    }
  }, [])

  useEffect(() => {
    checkConnection()

    // Check connection every 60 seconds
    const interval = setInterval(checkConnection, 60000)

    return () => clearInterval(interval)
  }, [checkConnection])

  // Don't show anything while initial check or if everything is working
  if (state.isConnected === null || (state.isConnected && state.tablesExist)) {
    return null
  }

  // Show connection issues
  if (!state.isConnected) {
    return (
      <StatusCard
        icon={<WifiOff className='mt-0.5 size-5 text-red-500' />}
        title='Connection Issue'
        message={state.error || 'Cannot connect to Supabase database'}
        buttonText={state.isChecking ? 'Checking...' : 'Retry'}
        onButtonClick={checkConnection}
        isButtonDisabled={state.isChecking}
        cardClassNames='bg-red-50 border-red-200'
        buttonClassNames='border-red-200 text-red-600 hover:bg-red-50'
        titleClassNames='text-red-800'
        messageClassNames='text-red-600'
      />
    )
  }

  // Show database setup needed
  if (state.isConnected && state.tablesExist === false) {
    return (
      <StatusCard
        icon={<Database className='mt-0.5 size-5 text-yellow-500' />}
        title='Database Setup Needed'
        message='Tables need to be created in Supabase'
        buttonText={state.isChecking ? 'Checking...' : 'Recheck'}
        onButtonClick={checkConnection}
        isButtonDisabled={state.isChecking}
        cardClassNames='bg-yellow-50 border-yellow-200'
        buttonClassNames='border-yellow-200 text-yellow-600 hover:bg-yellow-50'
        titleClassNames='text-yellow-800'
        messageClassNames='text-yellow-600'
      />
    )
  }

  return null
}
