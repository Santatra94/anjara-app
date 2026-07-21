'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { IdleWarningModal } from '@/components/IdleWarningModal';
import type { AuthUser, Utilisateur, Societe } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Durees d'inactivite en millisecondes
const TIMEOUT_LIVREUR = 60 * 60 * 1000;
const TIMEOUT_ADMIN_GERANT = 30 * 60 * 1000;
const WARNING_MS = 60 * 1000;
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Ref stable pour eviter recreations du client Supabase
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const loadUser = useCallback(async () => {
    try {
      setError(null);

      // 1. Lire la session locale (JWT cookie) — zero appel reseau
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const authUser = session.user;

      // 2. Un seul appel Supabase pour le profil + societe
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
        setError('Societe introuvable.');
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        router.push('/login');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { societe: _societe, ...utilisateurClean } =
        utilisateur as unknown as Utilisateur & { societe: Societe };

      setUser({
        id: authUser.id,
        email: authUser.email!,
        utilisateur: utilisateurClean as Utilisateur,
        societe: societe as Societe,
      });
    } catch (err) {
      console.error('Erreur AuthProvider:', err);
      setError('Erreur de session.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    // Chargement initial
    loadUser();

    // Ecoute les changements d'auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          loadUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  }, [supabase, router]);

  // ========== AUTO-DECONNEXION APRES INACTIVITE ==========
  const role = user?.utilisateur?.role;
  const timeoutMs = role === 'LIVREUR' ? TIMEOUT_LIVREUR : TIMEOUT_ADMIN_GERANT;
  const isConnected = !!user;

  const handleIdleLogout = useCallback(() => {
    signOut();
  }, [signOut]);

  const { isWarning, stayConnected } = useIdleLogout({
    timeoutMs,
    warningMs: WARNING_MS,
    onWarning: useCallback(() => {}, []),
    onLogout: handleIdleLogout,
    enabled: isConnected,
  });
  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, refresh: loadUser }}>
      {children}
      <IdleWarningModal
        open={isWarning}
        warningMs={WARNING_MS}
        onStay={stayConnected}
        onLogout={signOut}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}