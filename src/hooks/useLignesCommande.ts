'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LigneCommande, Produit } from '@/types/database.types';

export interface LigneWithProduit extends LigneCommande {
  produit: Produit | null;
}

export function useLignesCommande(commandeId: string) {
  const [lignes, setLignes] = useState<LigneWithProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchLignes = useCallback(async () => {
    if (!user || !commandeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('lignes_commande')
      .select('*, produit:produits(*)')
      .eq('commande_id', commandeId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setLignes((data as unknown as LigneWithProduit[]) || []);
    }
    setLoading(false);
  }, [user, commandeId, supabase]);

  useEffect(() => {
    fetchLignes();
  }, [fetchLignes]);

  const addLigne = async (values: { produit_id: string; quantite: number; prix_unitaire: number; categorie: 'YAOURT' | 'JUS' }) => {
    try {
      const { data, error } = await supabase
        .from('lignes_commande')
        .insert([{
          ...values,
          commande_id: commandeId,
          societe_id: user?.societe.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchLignes();
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      if (message.includes('dépasse la commande')) {
        toast.error("Préparation trop élevée", {
          description: "La quantité préparée dépasserait la commande. Créez une nouvelle commande pour le surplus.",
          duration: 6000
        });
      } else {
        toast.error("Erreur", { description: message });
      }
      return { success: false, error: message };
    }
  };

  const removeLigne = async (id: string) => {
    const { error } = await supabase
      .from('lignes_commande')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      toast.error("Erreur", { description: error.message });
      throw error;
    }
    await fetchLignes();
  };

  return { lignes, loading, addLigne, removeLigne, refresh: fetchLignes };
}
