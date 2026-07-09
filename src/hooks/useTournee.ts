'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TourneeDuJour } from '@/types/database.types';
import { toast } from 'sonner';

const CACHE_KEY = 'anjara_tournee_cache';
const ORDER_KEY = 'anjara_tournee_order';

export function useTournee() {
  const [tasks, setTasks] = useState<TourneeDuJour[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchTournee = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('v_tournee_du_jour')
        .select('*')
        .eq('livreur_id', user.id)
        .eq('societe_id', user.societe.id)
        .order('ordre', { ascending: true });

      if (error) throw error;

      // Sauvegarde en cache local pour l'offline
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setTasks((data as unknown as TourneeDuJour[]) || []);
    } catch (error) {
      console.error('Fetch error:', error);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setTasks(JSON.parse(cached));
        toast.info("Affichage des données en cache (hors ligne)");
      } else {
        const message = error instanceof Error ? error.message : "Erreur";
        toast.error("Impossible de charger la tournée", { description: message });
      }
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchTournee();
  }, [fetchTournee]);

  const updateTaskOrder = async (newTasks: TourneeDuJour[]) => {
    setTasks(newTasks);
    localStorage.setItem(ORDER_KEY, JSON.stringify(newTasks.map(t => t.tache_id)));

    if (typeof window !== 'undefined' && !navigator.onLine) {
        toast.info("Ordre enregistré localement (en attente de connexion)");
        return;
    }

    try {
      const updates = newTasks.map((task, index) => {
        if (task.type_tache === 'LIVRAISON') {
            return supabase
              .from('commandes')
              .update({ ordre_tournee: index + 1 })
              .eq('id', task.tache_id);
        } else {
            return supabase
              .from('promesses_recouvrement')
              .update({ ordre_tournee: index + 1 })
              .eq('id', task.tache_id);
        }
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('Order sync error:', error);
    }
  };

  return { tasks, loading, updateTaskOrder, refresh: fetchTournee };
}
