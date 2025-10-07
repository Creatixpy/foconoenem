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
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Buscar ou criar perfil
        getUserProfile(session.user.id).then(async (userProfile) => {
          const email = session.user.email;
          const metadataNome = session.user.user_metadata?.nome_completo || email?.split('@')[0];
          const storedNome = signupExtrasRef.current?.nomeCompleto || metadataNome;
          const storedObjetivo = signupExtrasRef.current?.objetivo || session.user.user_metadata?.objetivo || null;

          if (!userProfile) {
            await createUserProfile(session.user.id, storedNome ?? undefined, storedObjetivo ?? undefined);
            const newProfile = await getUserProfile(session.user.id);
            setProfile(newProfile);
          } else {
            let updatedProfile = userProfile;

            if (!userProfile.objetivo && storedObjetivo) {
              await updateUserProfile(session.user.id, { objetivo: storedObjetivo });
              updatedProfile = (await getUserProfile(session.user.id)) ?? userProfile;
            } else if (!userProfile.nome_completo && storedNome) {
              await updateUserProfile(session.user.id, { nome_completo: storedNome });
              updatedProfile = (await getUserProfile(session.user.id)) ?? userProfile;
            }

            setProfile(updatedProfile);
          }

          signupExtrasRef.current = null;
        });
      }
      
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const email = session.user.email;
        const metadataNome = session.user.user_metadata?.nome_completo || email?.split('@')[0];
        const storedNome = signupExtrasRef.current?.nomeCompleto || metadataNome;
        const storedObjetivo = signupExtrasRef.current?.objetivo || session.user.user_metadata?.objetivo || null;

        const userProfile = await getUserProfile(session.user.id);
        if (!userProfile) {
          await createUserProfile(session.user.id, storedNome ?? undefined, storedObjetivo ?? undefined);
          const newProfile = await getUserProfile(session.user.id);
          setProfile(newProfile);
        } else {
          let updatedProfile = userProfile;

          if (!userProfile.objetivo && storedObjetivo) {
            await updateUserProfile(session.user.id, { objetivo: storedObjetivo });
            updatedProfile = (await getUserProfile(session.user.id)) ?? userProfile;
          } else if ((!userProfile.nome_completo || userProfile.nome_completo === metadataNome) && storedNome) {
            await updateUserProfile(session.user.id, { nome_completo: storedNome });
            updatedProfile = (await getUserProfile(session.user.id)) ?? userProfile;
          }

          setProfile(updatedProfile);
        }

        signupExtrasRef.current = null;
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

