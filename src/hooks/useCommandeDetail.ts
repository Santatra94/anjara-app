'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Commande, Client, Zone, TypePdv, Utilisateur, LigneCommande, Produit, EcartCommandePreparation } from '@/types/database.types';

export interface CommandeFull extends Commande {
  client: (Client & { zone: Zone | null, type_pdv: TypePdv | null }) | null;
  livreur: Pick<Utilisateur, 'id' | 'nom'> | null;
  lignes_commande: (LigneCommande & { produit: Produit | null })[];
  ecart: EcartCommandePreparation | null;
}

export function useCommandeDetail(id: string) {
  const [commande, setCommande] = useState<CommandeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchCommande = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);

    // Requête 1 : Commande + relations réelles
    const { data: commandeData, error: commandeError } = await supabase
      .from('commandes')
      .select(`
        *,
        client:clients(*, zone:zones(*), type_pdv:type_pdv(*)),
        livreur:utilisateurs!livreur_assigne_id(id, nom),
        lignes_commande(*, produit:produits(*))
      `)
      .eq('id', id)
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .single();

    if (commandeError || !commandeData) {
      toast.error("Commande introuvable", { description: commandeError?.message });
      setCommande(null);
      setLoading(false);
      return;
    }

    // Requête 2 : Vue d'écart (séparée car pas de relation FKey possible pour auto-join)
    const { data: ecartData } = await supabase
      .from('v_ecart_commande_preparation')
      .select('*')
      .eq('commande_id', id)
      .maybeSingle();

    setCommande({
      ...(commandeData as unknown as CommandeFull),
      ecart: ecartData || null
    });

    setLoading(false);
  }, [user, id, supabase]);

  useEffect(() => {
    fetchCommande();
  }, [fetchCommande]);

  return { commande, loading, refresh: fetchCommande };
}
