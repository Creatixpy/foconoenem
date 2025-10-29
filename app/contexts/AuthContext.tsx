"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, getUserProfile, createUserProfile, updateUserProfile } from '@/lib/auth';

const SIGNUP_CONTEXT_KEY = 'foconoenem_signup_context';

type SignupContext = {
  nomeCompleto?: string | null;
  objetivo?: string | null;
  timestamp?: number;
} | null;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signupExtrasRef = useRef<SignupContext>(null);
  const isMountedRef = useRef(true);

  if (typeof window !== 'undefined' && signupExtrasRef.current === null) {
    const raw = sessionStorage.getItem(SIGNUP_CONTEXT_KEY);
    if (raw) {
      try {
        signupExtrasRef.current = JSON.parse(raw);
      } catch (error) {
        console.error('Não foi possível interpretar os dados temporários de cadastro:', error);
        signupExtrasRef.current = null;
      }
      sessionStorage.removeItem(SIGNUP_CONTEXT_KEY);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const resolveProfile = async (sessionUser: User | null) => {
      if (!sessionUser) {
        setProfile(null);
        return;
      }

      const email = sessionUser.email;
      const metadataNome = sessionUser.user_metadata?.nome_completo || email?.split('@')[0];
      const storedNome = signupExtrasRef.current?.nomeCompleto || metadataNome;
      const storedObjetivo = signupExtrasRef.current?.objetivo || sessionUser.user_metadata?.objetivo || null;

      try {
        const existingProfile = await getUserProfile(sessionUser.id);

        if (!existingProfile) {
          await createUserProfile(sessionUser.id, storedNome ?? undefined, storedObjetivo ?? undefined);
          const newProfile = await getUserProfile(sessionUser.id);
          setProfile(newProfile);
        } else {
          let updatedProfile = existingProfile;

          if (!existingProfile.objetivo && storedObjetivo) {
            await updateUserProfile(sessionUser.id, { objetivo: storedObjetivo });
            updatedProfile = (await getUserProfile(sessionUser.id)) ?? existingProfile;
          } else if ((!existingProfile.nome_completo || existingProfile.nome_completo === metadataNome) && storedNome) {
            await updateUserProfile(sessionUser.id, { nome_completo: storedNome });
            updatedProfile = (await getUserProfile(sessionUser.id)) ?? existingProfile;
          }

          setProfile(updatedProfile);
        }
      } catch (error) {
        console.error('Erro ao sincronizar perfil do usuário:', error);
      } finally {
        signupExtrasRef.current = null;
      }
    };

    const bootstrapAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!isMountedRef.current) {
          return;
        }

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        await resolveProfile(sessionUser);
      } catch (error) {
        console.error('Erro ao obter sessão atual:', error);
        if (isMountedRef.current) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) {
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      try {
        await resolveProfile(sessionUser);
      } catch (error) {
        console.error('Erro ao atualizar estado de autenticação:', error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOutHandler = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut: signOutHandler,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
