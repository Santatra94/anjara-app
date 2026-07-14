'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TourneeDuJour } from '@/types/database.types';
import { toast } from 'sonner';

export interface Livreur {
  id: string;
  nom: string;
  role: string;
}

export function useTourneeAdmin(livreurId: string | null) {
  const [tasks, setTasks] = useState<TourneeDuJour[]>([]);
  const [loading, setLoading] = useState(true);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loadingLivreurs, setLoadingLivreurs] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch liste livreurs (LIVREUR + ADMIN + GERANT)
  const fetchLivreurs = useCallback(async () => {
    if (!user) return;
    setLoadingLivreurs(true);
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, role')
        .eq('societe_id', user.societe.id)
        .eq('actif', true)
        .in('role', ['LIVREUR', 'ADMIN', 'GERANT'])
        .order('nom', { ascending: true });

      if (error) throw error;
      setLivreurs((data as Livreur[]) || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Impossible de charger les livreurs", { description: message });
    } finally {
      setLoadingLivreurs(false);
    }
  }, [user, supabase]);

  // Fetch tournee du livreur selectionne
  const fetchTournee = useCallback(async () => {
    if (!user || !livreurId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_tournee_du_jour')
        .select('*')
        .eq('livreur_id', livreurId)
        .eq('societe_id', user.societe.id)
        .order('ordre', { ascending: true });

      if (error) throw error;
      setTasks((data as unknown as TourneeDuJour[]) || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Impossible de charger la tournee", { description: message });
    } finally {
      setLoading(false);
    }
  }, [user, livreurId, supabase]);

  useEffect(() => {
    fetchLivreurs();
  }, [fetchLivreurs]);

  useEffect(() => {
    fetchTournee();
  }, [fetchTournee]);

  return {
    tasks,
    loading,
    livreurs,
    loadingLivreurs,
    refresh: fetchTournee,
  };
              }
