'use client';

/**
 * Authentication Context Provider
 * Secure session management with activity tracking
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SESSION_CONFIG } from './constants';
import { updateLastActivity, isSessionIdle, clearAuthStorage } from './security';
import { getUserProfile, createUserProfile, updateUserProfile } from './profile-service';
import type { UserProfile, OAuthSignupContext } from './types';

const supabase = createClient();

async function refreshSession(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
    updateLastActivity();
    return { success: true };
  } catch (error) {
    console.error('Erro ao renovar sessão:', error);
    return { success: false };
  }
}

async function signOut(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearAuthStorage();
    return { success: true };
  } catch (error) {
    console.error('Erro ao sair:', error);
    return { success: false };
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const signupContextRef = useRef<OAuthSignupContext | null>(null);
  const isMountedRef = useRef(true);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load signup context from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && signupContextRef.current === null) {
      try {
        const raw = sessionStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SIGNUP_CONTEXT);
        if (raw) {
          const parsed = JSON.parse(raw) as OAuthSignupContext;
          // Only use if less than 10 minutes old
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            signupContextRef.current = parsed;
          }
          sessionStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.SIGNUP_CONTEXT);
        }
      } catch {
        signupContextRef.current = null;
      }
    }
  }, []);

  // Resolve profile for a user
  const resolveProfile = useCallback(async (sessionUser: User | null) => {
    if (!sessionUser) {
      setProfile(null);
      return;
    }

    const email = sessionUser.email;
    const metadataNome = sessionUser.user_metadata?.nome_completo ||
      sessionUser.user_metadata?.full_name ||
      email?.split('@')[0];
    const storedNome = signupContextRef.current?.nomeCompleto || metadataNome;
    const storedObjetivo = signupContextRef.current?.objetivo ||
      sessionUser.user_metadata?.objetivo ||
      null;

    try {
      let existingProfile = await getUserProfile(sessionUser.id);

      if (!existingProfile) {
        // Create new profile
        await createUserProfile(sessionUser.id, storedNome ?? undefined, storedObjetivo ?? undefined);
        existingProfile = await getUserProfile(sessionUser.id);
      } else {
        // Update missing fields if we have stored values
        let needsUpdate = false;
        const updates: Partial<UserProfile> = {};

        if (!existingProfile.objetivo && storedObjetivo) {
          updates.objetivo = storedObjetivo;
          needsUpdate = true;
        }

        if (!existingProfile.nome_completo && storedNome) {
          updates.nome_completo = storedNome;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateUserProfile(sessionUser.id, updates);
          existingProfile = await getUserProfile(sessionUser.id);
        }
      }

      if (isMountedRef.current) {
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Erro ao sincronizar perfil:', error);
    } finally {
      signupContextRef.current = null;
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      if (isMountedRef.current) {
        setProfile(userProfile);
      }
    }
  }, [user]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    const result = await refreshSession();
    if (result.success) {
      const { data } = await supabase.auth.getSession();
      if (isMountedRef.current && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } else {
      // Refresh failed — session may be invalid. Clear state to prevent
      // stale user/session from blocking downstream UI (e.g. /conta loading).
      const { data } = await supabase.auth.getSession();
      if (isMountedRef.current && !data.session) {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    }
  }, []);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    await signOut();
    if (isMountedRef.current) {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  // Re-validate session when tab becomes visible again.
  // Supabase's built-in autoRefreshToken pauses while the tab is hidden.
  // When it resumes it may silently fail, leaving stale tokens in state.
  // Calling getUser() validates server-side and triggers onAuthStateChange
  // if the session changed, which updates user/session/profile above.
  useEffect(() => {
    if (!session) return;

    let revalidating = false;

    const revalidateSession = async () => {
      if (revalidating) return;
      revalidating = true;
      try {
        await supabase.auth.getUser();
      } catch {
        // Validation failed — onAuthStateChange will handle sign-out
      } finally {
        revalidating = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void revalidateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [session]);

  // Activity tracking and idle timeout
  useEffect(() => {
    if (!session) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    // Only check idle timeout — token refresh is handled by Supabase's
    // built-in autoRefreshToken. The manual refresh in refreshAuth() is
    // only called on-demand (e.g. before saving quiz results).
    const checkIdleTimeout = async () => {
      if (isSessionIdle()) {
        console.log('Sessão inativa, fazendo logout...');
        await handleSignOut();
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    activityIntervalRef.current = setInterval(checkIdleTimeout, 60 * 1000);

    updateLastActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [session, handleSignOut]);

  // Bootstrap auth on mount
  useEffect(() => {
    isMountedRef.current = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (!isMountedRef.current) return;

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        setSession(data.session);
        
        await resolveProfile(sessionUser);
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
        if (isMountedRef.current) {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    void bootstrap();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMountedRef.current) return;

        const sessionUser = newSession?.user ?? null;

        // Keep user and session atomic — never allow user without session
        setSession(newSession);
        setUser(newSession ? sessionUser : null);

        if (event === 'SIGNED_OUT' || !newSession) {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            clearAuthStorage();
          }
        } else if (sessionUser) {
          await resolveProfile(sessionUser);
          updateLastActivity();
        }

        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [resolveProfile]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    initialized,
    signOut: handleSignOut,
    refreshProfile,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

/**
 * Hook to require authentication
 * Returns user/profile only when authenticated
 */
export function useRequireAuth(): {
  user: User;
  profile: UserProfile | null;
  loading: boolean;
} | null {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  if (!user) {
    return null;
  }
  
  return { user, profile, loading: false };
}
