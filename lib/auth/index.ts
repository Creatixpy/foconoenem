/**
 * Authentication System - Main Export
 * Centralized exports for the authentication module
 */

// Constants
export {
  SESSION_CONFIG,
  PASSWORD_REQUIREMENTS,
  RATE_LIMIT_CONFIG,
  OAUTH_CONFIG,
  AUTH_PATHS,
  AUTH_ERROR_CODES,
} from './constants';

// Types
export type {
  UserProfile,
  UserStatistics,
  AuthState,
  SignUpData,
  SignInData,
  OAuthSignupContext,
  PasswordValidationResult,
  AuthResult,
  SessionInfo,
  RateLimitInfo,
  AuthError,
} from './types';

// Validation
export {
  validatePassword,
  validateEmail,
  sanitizeInput,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from './validation';

// Security
export {
  generateSecureToken,
  sanitizeRedirectPath,
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimit,
  updateLastActivity,
  getLastActivity,
  isSessionIdle,
  clearAuthStorage,
  parseUserAgent,
} from './security';

// Auth Service
export {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  requestPasswordReset,
  updatePassword,
} from './service';

// Profile Service
export {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} from './profile-service';
