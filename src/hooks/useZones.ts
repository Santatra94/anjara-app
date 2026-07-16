'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Zone } from '@/types';
import { toast } from 'sonner';

async function fetchZones(societeId: string): Promise<Zone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('societe_id', societeId)
    .eq('is_archived', false)
    .order('nom');

  if (error) {
    toast.error('Erreur chargement zones', { description: error.message });
    throw error;
  }
  return data || [];
}

export function useZones() {
  const { user } = useAuth();
  const supabase = createClient();

  // Cle unique basee sur la societe (evite mix entre societes)
  const cacheKey = user?.societe?.id ? ['zones', user.societe.id] : null;

  const { data, error, isLoading, mutate } = useSWR<Zone[]>(
    cacheKey,
    () => fetchZones(user!.societe.id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const zones = data || [];
  const loading = isLoading;

  const addZone = async (values: { nom: string; ville?: string | null }) => {
    if (!user) return;
    const { error } = await supabase.from('zones').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    mutate();
  };

  const updateZone = async (id: string, values: { nom: string; ville?: string | null }) => {
    const { error } = await supabase.from('zones').update(values).eq('id', id);
    if (error) throw error;
    mutate();
  };

  const archiveZone = async (id: string) => {
    const { error } = await supabase.from('zones').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    mutate();
  };

  return {
    zones,
    loading,
    error,
    addZone,
    updateZone,
    archiveZone,
    refresh: () => mutate(),
  };
}
