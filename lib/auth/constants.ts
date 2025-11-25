/**
 * Authentication System Constants
 * Centralized configuration for the authentication module
 */

// Session configuration
export const SESSION_CONFIG = {
  // Maximum session duration (7 days in seconds)
  MAX_SESSION_DURATION: 7 * 24 * 60 * 60,
  // Session refresh threshold (refresh when 1 hour remaining)
  REFRESH_THRESHOLD: 60 * 60,
  // Idle timeout (30 minutes of inactivity)
  IDLE_TIMEOUT: 30 * 60 * 1000,
  // Storage keys
  STORAGE_KEYS: {
    SESSION_ACTIVITY: 'foconoenem_last_activity',
    SIGNUP_CONTEXT: 'foconoenem_signup_context',
    AUTH_STATE: 'foconoenem_auth_state',
  },
} as const;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Max login attempts per window
  MAX_LOGIN_ATTEMPTS: 5,
  // Window duration in minutes
  WINDOW_MINUTES: 15,
  // Lockout duration in minutes after max attempts
  LOCKOUT_MINUTES: 30,
} as const;

// OAuth configuration
export const OAUTH_CONFIG = {
  GOOGLE: {
    SCOPES: ['email', 'profile'],
    ACCESS_TYPE: 'offline',
    PROMPT: 'consent',
  },
} as const;

// Redirect paths
export const AUTH_PATHS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  CALLBACK: '/auth/callback',
  ERROR: '/auth/auth-code-error',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  DEFAULT_REDIRECT: '/conta',
} as const;

// Error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  USER_BANNED: 'AUTH_USER_BANNED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
  INVALID_PASSWORD: 'AUTH_INVALID_PASSWORD',
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  EMAIL_IN_USE: 'AUTH_EMAIL_IN_USE',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  NETWORK_ERROR: 'AUTH_NETWORK_ERROR',
  UNKNOWN_ERROR: 'AUTH_UNKNOWN_ERROR',
} as const;

// Community terms version
export const COMMUNITY_TERMS_VERSION = '2024-07-community';
