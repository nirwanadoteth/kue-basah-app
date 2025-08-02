'use client';

/**
 * Renders the site footer with the current year and copyright notice.
 */
export function Footer() {
	return (
		<footer className='w-full py-4 mt-8 text-center text-sm text-gray-500 border-t border-gray-200'>
			<p>
				© {new Date().getFullYear()} NAY&apos;S CAKE. All rights
				reserved.
			</p>
		</footer>
	);
}
