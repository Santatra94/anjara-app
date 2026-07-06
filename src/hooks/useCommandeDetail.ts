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

    const { data, error } = await supabase
      .from('commandes')
      .select(`
        *,
        client:clients(*, zone:zones(*), type_pdv:type_pdv(*)),
        livreur:utilisateurs!livreur_assigne_id(id, nom),
        lignes_commande(*, produit:produits(*)),
        ecart:v_ecart_commande_preparation(*)
      `)
      .eq('id', id)
      .eq('societe_id', user.societe.id)
      .single();

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setCommande(data as unknown as CommandeFull);
    }
    setLoading(false);
  }, [user, id, supabase]);

  useEffect(() => {
    fetchCommande();
  }, [fetchCommande]);

  return { commande, loading, refresh: fetchCommande };
}
