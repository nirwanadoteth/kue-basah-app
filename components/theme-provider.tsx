'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Wraps child components with theme context using the Next.js themes provider.
 *
 * Passes all received props to the underlying NextThemesProvider.
 *
 * @param children - The React nodes to be rendered within the theme context
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
