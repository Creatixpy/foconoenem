"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, getUserProfile, createUserProfile } from '@/lib/auth';

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
          if (!userProfile) {
            // Criar perfil se não existir
            const email = session.user.email;
            const nomeCompleto = session.user.user_metadata?.nome_completo || email?.split('@')[0];
            await createUserProfile(session.user.id, nomeCompleto);
            const newProfile = await getUserProfile(session.user.id);
            setProfile(newProfile);
          } else {
            setProfile(userProfile);
          }
        });
      }
      
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id);
        if (!userProfile) {
          const email = session.user.email;
          const nomeCompleto = session.user.user_metadata?.nome_completo || email?.split('@')[0];
          await createUserProfile(session.user.id, nomeCompleto);
          const newProfile = await getUserProfile(session.user.id);
          setProfile(newProfile);
        } else {
          setProfile(userProfile);
        }
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

