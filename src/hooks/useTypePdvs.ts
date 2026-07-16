'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TypePdv } from '@/types';
import { toast } from 'sonner';

async function fetchTypesPdv(societeId: string): Promise<TypePdv[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('type_pdv')
    .select('*')
    .eq('societe_id', societeId)
    .eq('is_archived', false)
    .order('nom_type');

  if (error) {
    toast.error('Erreur chargement types PDV', { description: error.message });
    throw error;
  }
  return data || [];
}

export function useTypePdvs() {
  const { user } = useAuth();
  const supabase = createClient();

  const cacheKey = user?.societe?.id ? ['type_pdv', user.societe.id] : null;

  const { data, error, isLoading, mutate } = useSWR<TypePdv[]>(
    cacheKey,
    () => fetchTypesPdv(user!.societe.id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const types = data || [];
  const loading = isLoading;

  const addType = async (values: { nom_type: string }) => {
    if (!user) return;
    const { error } = await supabase.from('type_pdv').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    mutate();
  };

  const updateType = async (id: string, values: { nom_type: string }) => {
    const { error } = await supabase.from('type_pdv').update(values).eq('id', id);
    if (error) throw error;
    mutate();
  };

  const archiveType = async (id: string) => {
    const { error } = await supabase.from('type_pdv').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    mutate();
  };

  return {
    types,
    loading,
    error,
    addType,
    updateType,
    archiveType,
    refresh: () => mutate(),
  };
}
