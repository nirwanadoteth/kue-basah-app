'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme='light'
      className='toaster group'
      position='top-right'
      expand={true}
      richColors={true}
      closeButton={true}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toast]:border-red-200 group-[.toast]:bg-red-50',
          success: 'group-[.toast]:border-green-200 group-[.toast]:bg-green-50',
          warning:
            'group-[.toast]:border-yellow-200 group-[.toast]:bg-yellow-50',
          info: 'group-[.toast]:border-blue-200 group-[.toast]:bg-blue-50',
        },
      }}
      {...props}
    />
  )
}
