'use client'

/**
 * Renders the site footer with the current year and copyright notice.
 */
export function Footer() {
  return (
    <footer className='mt-8 w-full border-t border-gray-200 py-4 text-center text-sm text-gray-500'>
      <p>© {new Date().getFullYear()} NAY&apos;S CAKE. All rights reserved.</p>
    </footer>
  )
}
