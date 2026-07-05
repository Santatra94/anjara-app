'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, Utilisateur, Societe } from '@/types';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Récupérer le profil utilisateur avec la société
      const { data: utilisateur, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError || !utilisateur) {
        console.error('Erreur chargement utilisateur:', userError);
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: societe, error: societeError } = await supabase
        .from('societes')
        .select('*')
        .eq('id', utilisateur.societe_id)
        .single();

      if (societeError || !societe) {
        console.error('Erreur chargement société:', societeError);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email!,
        utilisateur: utilisateur as Utilisateur,
        societe: societe as Societe,
      });
      setLoading(false);
    }

    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      () => {
        loadUser();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, loading, signOut };
}
