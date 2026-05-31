/**
 * Security Utilities for Authentication
 * CSRF protection, rate limiting, and security helpers
 */

import { SESSION_CONFIG } from './constants';

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  if (globalThis.crypto) {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Crypto API indisponível para gerar token seguro');
}

/**
 * Sanitizes redirect path to prevent open redirect vulnerabilities
 */
export function sanitizeRedirectPath(value: string | undefined | null, fallback: string = '/conta'): string {
  if (!value) {
    return fallback;
  }

  // Must start with single forward slash
  if (!value.startsWith('/')) {
    return fallback;
  }

  // Prevent protocol-relative URLs
  if (value.startsWith('//')) {
    return fallback;
  }

  // Prevent javascript: URLs
  if (value.toLowerCase().includes('javascript:')) {
    return fallback;
  }

  // Prevent data: URLs
  if (value.toLowerCase().includes('data:')) {
    return fallback;
  }

  // Remove any encoded characters that could be malicious
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes('//') || decoded.toLowerCase().includes('javascript:')) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return value;
}

/**
 * Rate limiter for client-side
 */
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remainingAttempts: number; lockedUntil?: Date } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if locked out
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
    };
  }

  // Check if window expired
  if (entry && now - entry.firstAttempt > windowMs) {
    rateLimitStore.delete(identifier);
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  if (!entry) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  const remaining = maxAttempts - entry.attempts;
  return {
    allowed: remaining > 0,
    remainingAttempts: Math.max(0, remaining),
    lockedUntil: entry.lockedUntil ? new Date(entry.lockedUntil) : undefined,
  };
}

export function recordRateLimitAttempt(
  identifier: string,
  maxAttempts: number = 5,
  lockoutMs: number = 30 * 60 * 1000
): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
    });
    return;
  }

  entry.attempts += 1;

  if (entry.attempts >= maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
  }

  rateLimitStore.set(identifier, entry);
}

export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Activity tracker for session management
 */
export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(
      SESSION_CONFIG.STORAGE_KEYS.SESSION_ACTIVITY,
      Date.now().toString()
    );
  } catch {
    // Ignore storage errors
  }
}

export function getLastActivity(): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_ACTIVITY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

export function isSessionIdle(idleTimeoutMs: number = SESSION_CONFIG.IDLE_TIMEOUT): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  
  return Date.now() - lastActivity > idleTimeoutMs;
}

/**
 * Clears all auth-related storage
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    Object.values(SESSION_CONFIG.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Parses user agent for session display
 */
export function parseUserAgent(userAgent: string | undefined): {
  browser: string;
  os: string;
  device: string;
} {
  if (!userAgent) {
    return { browser: 'Desconhecido', os: 'Desconhecido', device: 'Desconhecido' };
  }

  let browser = 'Desconhecido';
  let os = 'Desconhecido';
  let device = 'Desktop';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return { browser, os, device };
}
