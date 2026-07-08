'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Produit } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { produitSchema } from '@/lib/schemas';

type ProduitValues = z.infer<typeof produitSchema>;

export function useProduits() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchProduits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .order('nom_produit');

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setProduits(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  const addProduit = async (values: ProduitValues) => {
    if (!user) return;
    const { error } = await supabase.from('produits').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    fetchProduits();
  };

  const updateProduit = async (id: string, values: ProduitValues) => {
    const { error } = await supabase.from('produits').update(values).eq('id', id);
    if (error) throw error;
    fetchProduits();
  };

  const archiveProduit = async (id: string) => {
    const { error } = await supabase.from('produits').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    fetchProduits();
  };

  return { produits, loading, addProduit, updateProduit, archiveProduit, refresh: fetchProduits };
}
