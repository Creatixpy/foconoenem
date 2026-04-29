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

export type {
  UserProfileRow,
  UserProfileInsert,
  UserProfileUpdate,
  UserStatisticsRow,
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
  EventType,
  EssayOrigin,
  UserProfile,
  UserStatistics,
  EssayCompetence,
  EssayResult,
  QuizResult,
  Noticia,
  PaginationOptions,
  SortOptions,
  QueryOptions,
  Result,
  QueryResult,
  QueryError,
  PaginatedResult,
} from './types';

export {
  toUserProfile,
  toUserStatistics,
  toNoticia,
  fromUserProfileUpdate,
  fromNoticiaInsert,
} from './transformers';

import * as essaysRepo from './repositories/essays';
import * as quizzesRepo from './repositories/quizzes';
export const essays = essaysRepo;
export const quizzes = quizzesRepo;

import { getBrowserClient } from './client';

export const db = {
  getBrowserClient,
  essays: essaysRepo,
  quizzes: quizzesRepo,
};

export default db;
