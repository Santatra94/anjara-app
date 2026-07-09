'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, Utilisateur, Societe } from '@/types';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        setError(null);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Récupérer le profil utilisateur
        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError || !utilisateur) {
          console.error('Profil utilisateur introuvable:', userError);
          setError('Votre profil utilisateur est introuvable. Contactez un administrateur.');
          // Déconnecter automatiquement l'utilisateur cassé
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }

        // Récupérer la société
        const { data: societe, error: societeError } = await supabase
          .from('societes')
          .select('*')
          .eq('id', utilisateur.societe_id)
          .single();

        if (societeError || !societe) {
          console.error('Société introuvable:', societeError);
          setError('Société introuvable. Contactez un administrateur.');
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email!,
          utilisateur: utilisateur as Utilisateur,
          societe: societe as Societe,
        });
      } catch (err) {
        console.error('Erreur inattendue useAuth:', err);
        setError('Erreur lors du chargement de votre session.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else {
          loadUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return { user, loading, error, signOut };
}
