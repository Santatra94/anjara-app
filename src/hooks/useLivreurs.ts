'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Utilisateur } from '@/types';
import { toast } from 'sonner';

export function useLivreurs() {
  const [livreurs, setLivreurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchLivreurs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*, zone:zones(*)')
      .eq('societe_id', user.societe.id)
      .eq('role', 'LIVREUR')
      .eq('is_archived', false)
      .order('nom');

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setLivreurs(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchLivreurs();
  }, [fetchLivreurs]);

  return { livreurs, loading, refresh: fetchLivreurs };
}
