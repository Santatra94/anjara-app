'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Produit } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { produitSchema } from '@/lib/schemas';

type ProduitValues = z.infer<typeof produitSchema>;

async function fetchProduits(societeId: string): Promise<Produit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('societe_id', societeId)
    .eq('is_archived', false)
    .order('nom_produit');

  if (error) {
    toast.error('Erreur chargement produits', { description: error.message });
    throw error;
  }
  return data || [];
}

export function useProduits() {
  const { user } = useAuth();
  const supabase = createClient();

  const cacheKey = user?.societe?.id ? ['produits', user.societe.id] : null;

  const { data, error, isLoading, mutate } = useSWR<Produit[]>(
    cacheKey,
    () => fetchProduits(user!.societe.id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const produits = data || [];
  const loading = isLoading;

  const addProduit = async (values: ProduitValues) => {
    if (!user) return;
    const { error } = await supabase.from('produits').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    mutate();
  };

  const updateProduit = async (id: string, values: ProduitValues) => {
    const { error } = await supabase.from('produits').update(values).eq('id', id);
    if (error) throw error;
    mutate();
  };

  const archiveProduit = async (id: string) => {
    const { error } = await supabase.from('produits').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    mutate();
  };

  return {
    produits,
    loading,
    error,
    addProduit,
    updateProduit,
    archiveProduit,
    refresh: () => mutate(),
  };
}
