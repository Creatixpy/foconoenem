'use client';

import { useEffect, RefObject } from 'react';

/**
 * Hook that detects clicks outside of the specified element
 * @param ref - React ref to the element to monitor
 * @param handler - Callback function to run when clicking outside
 * @param enabled - Whether the hook is active (default: true)
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [ref, handler, enabled]);
}

export default useOutsideClick;
