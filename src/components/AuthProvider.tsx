'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, Utilisateur, Societe } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadUser = async () => {
    try {
      setError(null);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Une seule requête avec JOIN pour utilisateur + société
      const { data: utilisateur, error: userError } = await supabase
        .from('utilisateurs')
        .select('*, societe:societes(*)')
        .eq('id', authUser.id)
        .single();

      if (userError || !utilisateur) {
        console.error('Profil utilisateur introuvable:', userError);
        setError('Votre profil utilisateur est introuvable.');
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        router.push('/login');
        return;
      }

      const societe = (utilisateur as unknown as { societe: Societe }).societe;

      if (!societe) {
        setError('Société introuvable.');
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        router.push('/login');
        return;
      }

      // Retirer la propriété societe imbriquée du user pour éviter la duplication
      const { societe: _, ...utilisateurClean } = utilisateur as unknown as Utilisateur & { societe: Societe };

      setUser({
        id: authUser.id,
        email: authUser.email!,
        utilisateur: utilisateurClean as Utilisateur,
        societe: societe as Societe,
      });
    } catch (err) {
      console.error('Erreur useAuth:', err);
      setError('Erreur de session.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // Ne recharger QUE si l'événement change vraiment l'état auth
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          loadUser();
        }
        // Ignorer TOKEN_REFRESHED et USER_UPDATED (pas besoin de refetch)
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
