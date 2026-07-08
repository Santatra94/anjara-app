'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatutCommande, Commande } from '@/types/database.types';
import { toast } from 'sonner';
import { CommandeCreateValues } from '@/lib/schemas/commande.schema';

export interface CommandesFilters {
  date_livraison?: string;
  statut?: StatutCommande;
  client_id?: string;
  livreur_id?: string;
  search?: string;
}

export interface CommandeWithRelations extends Commande {
  client: { id: string; nom_pdv: string } | null;
  livreur: { id: string; nom: string } | null;
}

export function useCommandes(filters?: CommandesFilters) {
  const [commandes, setCommandes] = useState<CommandeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchCommandes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('commandes')
      .select(`
        *,
        client:clients(id, nom_pdv),
        livreur:utilisateurs!livreur_assigne_id(id, nom)
      `)
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (filters?.date_livraison) {
      query = query.eq('date_livraison', filters.date_livraison);
    }
    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.livreur_id) {
      query = query.eq('livreur_assigne_id', filters.livreur_id);
    }

    if (filters?.search) {
        query = query.ilike('code_commande', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setCommandes((data as unknown as CommandeWithRelations[]) || []);
    }
    setLoading(false);
  }, [user, supabase, filters?.date_livraison, filters?.statut, filters?.client_id, filters?.livreur_id, filters?.search]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const createCommande = async (values: CommandeCreateValues): Promise<Commande | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from('commandes').insert([{
      ...values,
      societe_id: user.societe.id
    }]).select().single();

    if (error) throw error;
    return data;
  };

  const updateStatut = async (id: string, statut: StatutCommande) => {
    const { error } = await supabase.from('commandes').update({ statut }).eq('id', id);
    if (error) throw error;
    fetchCommandes();
  };

  return { commandes, loading, createCommande, updateStatut, refresh: fetchCommandes };
}
