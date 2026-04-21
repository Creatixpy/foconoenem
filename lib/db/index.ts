/**
 * Database Module
 * Centralized database access layer for the application
 * 
 * Usage:
 * ```typescript
 * import { db } from '@/lib/db';
 * 
 * // Get browser client for client-side code
 * const client = db.getBrowserClient();
 * 
 * // Use repositories for structured data access
 * const profile = await db.users.getProfile(client, userId);
 * const essays = await db.essays.getUserEssays(client, userId);
 * ```
 */

// ============================================================================
// Client Exports
// ============================================================================

export {
  getBrowserClient,
  withTimeout,
  DatabaseError,
  isNotFoundError,
  DB_CONFIG,
  type SupabaseClient,
  type Database,
  type QueryTimeoutLevel,
} from './client';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Row types
  UserProfileRow,
  UserProfileInsert,
  UserProfileUpdate,
  UserStatisticsRow,
  UserGoalRow,
  UserAchievementRow,
  AchievementRow,
  EssayResultRow,
  EssayResultInsert,
  QuizResultRow,
  QuizResultInsert,
  NoticiaRow,
  NoticiaInsert,
  NoticiaUpdate,
  CachedThemeRow,
  AnalyticsEventRow,
  AnalyticsEventInsert,
  RateLimitRow,
  ConfiguracaoRow,
  
  // Enums
  EventType,
  GoalType,
  EssayOrigin,
  
  // Application models
  UserProfile,
  UserStatistics,
  EssayCompetence,
  EssayResult,
  QuizResult,
  Noticia,
  
  // Query options
  PaginationOptions,
  SortOptions,
  QueryOptions,
  Result,
  QueryResult,
  QueryError,
  PaginatedResult,
} from './types';

// ============================================================================
// Transformer Exports
// ============================================================================

export {
  toUserProfile,
  toUserStatistics,
  toNoticia,
  fromUserProfileUpdate,
  fromNoticiaInsert,
} from './transformers';

// ============================================================================
// Repository Exports (namespaced)
// ============================================================================

import * as usersRepo from './repositories/users';
import * as essaysRepo from './repositories/essays';
import * as quizzesRepo from './repositories/quizzes';
import * as newsRepo from './repositories/news';
import * as analyticsRepo from './repositories/analytics';

export const users = usersRepo;
export const essays = essaysRepo;
export const quizzes = quizzesRepo;
export const news = newsRepo;
export const analytics = analyticsRepo;

// ============================================================================
// Convenience namespace export
// ============================================================================

import { getBrowserClient } from './client';

export const db = {
  // Clients
  getBrowserClient,
  
  // Repositories
  users: usersRepo,
  essays: essaysRepo,
  quizzes: quizzesRepo,
  news: newsRepo,
  analytics: analyticsRepo,
};

export default db;
