'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CompteJourLivreur } from '@/types/database.types';
import { toast } from 'sonner';

export function useCaisse() {
  const [data, setData] = useState<CompteJourLivreur | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchCaisse = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: caisseData, error: caisseError } = await supabase
        .from('v_compte_jour_livreur')
        .select('*')
        .eq('livreur_id', user.id)
        .eq('societe_id', user.societe.id)
        .maybeSingle();

      if (caisseError) throw caisseError;
      setData(caisseData as unknown as CompteJourLivreur);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de chargement";
      toast.error("Erreur de chargement de la caisse", { description: message });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchCaisse();
  }, [fetchCaisse]);

  return { data, loading, refresh: fetchCaisse };
}
