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
  COMMUNITY_TERMS_VERSION,
} from './constants';

// Types
export type {
  UserProfile,
  UserStatistics,
  UserGoal,
  Achievement,
  UserAchievement,
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
  generateCSRFToken,
  validateCSRFToken,
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
  // Authentication
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  requestPasswordReset,
  updatePassword,
  
  // Profile
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  
  // Statistics
  getUserStatistics,
  recalculateUserStatistics,
  
  // Goals
  getUserGoals,
  createUserGoal,
  updateUserGoal,
  deleteUserGoal,
  
  // Achievements
  getUserAchievements,
  
  // Community
  confirmCommunityAge,
  acceptCommunityTerms,
  updateCommunitySettings,
} from './service';
