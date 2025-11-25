'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** Current theme setting (light, dark, or system) */
  theme: Theme;
  /** Resolved theme based on system preference when theme is 'system' */
  resolvedTheme: ResolvedTheme;
  /** Set the theme */
  setTheme: (value: Theme) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Whether the system prefers dark mode */
  systemPrefersDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

// Script to inject into <head> for preventing FOUC (Flash of Unstyled Content)
export const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('${STORAGE_KEY}');
      var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'system');
    }
  })();
`;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(value: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', value);
}

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage might be unavailable in some contexts
  }

  return null;
}

function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage might be unavailable
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme to use if no stored preference exists */
  defaultTheme?: Theme;
  /** Force a specific theme (useful for testing) */
  forcedTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Compute resolved theme
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    const activeTheme = forcedTheme ?? theme;
    if (activeTheme === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return activeTheme;
  }, [theme, systemPrefersDark, forcedTheme]);

  // Initialize theme from storage on mount
  useEffect(() => {
    const storedTheme = readStoredTheme();
    if (storedTheme) {
      setThemeState(storedTheme);
    }

    // Initialize system preference
    setSystemPrefersDark(getSystemTheme() === 'dark');
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    // Set initial value
    setSystemPrefersDark(mediaQuery.matches);

    // Modern browsers
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Apply theme to document when it changes
  useEffect(() => {
    if (!mounted) return;

    const activeTheme = forcedTheme ?? theme;
    applyThemeToDocument(activeTheme);
    saveTheme(activeTheme);
  }, [theme, forcedTheme, mounted]);

  // Theme setter with validation
  const setTheme = useCallback((value: Theme) => {
    if (value !== 'light' && value !== 'dark' && value !== 'system') {
      console.warn(`Invalid theme value: ${value}. Using 'system' instead.`);
      setThemeState('system');
      return;
    }
    setThemeState(value);
  }, []);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      // If currently system, toggle based on resolved theme
      if (current === 'system') {
        return systemPrefersDark ? 'light' : 'dark';
      }
      return current === 'light' ? 'dark' : 'light';
    });
  }, [systemPrefersDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: forcedTheme ?? theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      systemPrefersDark,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, systemPrefersDark, forcedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get just the resolved theme (light or dark)
 * Useful for components that only need to know the current visual theme
 */
export function useResolvedTheme(): ResolvedTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}
