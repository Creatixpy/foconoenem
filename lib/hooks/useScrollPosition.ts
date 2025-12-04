'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track scroll position and determine if page is scrolled
 * @param threshold - Scroll distance in pixels before considered "scrolled" (default: 16)
 * @returns Object with isScrolled boolean and scrollY position
 */
export function useScrollPosition(threshold: number = 16) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);
            setIsScrolled(currentScrollY > threshold);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return { isScrolled, scrollY };
}

export default useScrollPosition;
