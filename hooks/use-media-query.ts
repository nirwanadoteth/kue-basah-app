import { useState, useEffect } from 'react';

/**
 * React hook that returns whether a given media query currently matches.
 *
 * @param query - The media query string to evaluate
 * @returns `true` if the media query matches the current viewport, otherwise `false`
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		if (media.matches !== matches) {
			setMatches(media.matches);
		}
		const listener = () => {
			setMatches(media.matches);
		};
		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	}, [query]);

	return matches;
}
