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

  // Activity tracking and session refresh
  useEffect(() => {
    if (!session) return;

    // Update activity on user interactions
    const handleActivity = () => {
      updateLastActivity();
    };

    // Check for idle timeout and session refresh periodically
    const checkSession = async () => {
      if (isSessionIdle()) {
        console.log('Sessão inativa, fazendo logout...');
        await handleSignOut();
        return;
      }

      // Refresh session if needed (within 1 hour of expiry)
      if (session.expires_at) {
        const expiresAt = session.expires_at * 1000;
        const refreshThreshold = SESSION_CONFIG.REFRESH_THRESHOLD * 1000;
        
        if (expiresAt - Date.now() < refreshThreshold) {
          await refreshAuth();
        }
      }
    };

    // Add activity listeners
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check session every minute
    activityIntervalRef.current = setInterval(checkSession, 60 * 1000);

    // Initial activity update
    updateLastActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [session, handleSignOut, refreshAuth]);

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
        setUser(sessionUser);
        setSession(newSession);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          clearAuthStorage();
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
