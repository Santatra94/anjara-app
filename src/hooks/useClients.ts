'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Client } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientSchema } from '@/lib/schemas';

type ClientValues = z.infer<typeof clientSchema>;

async function fetchClients(societeId: string): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*, zone:zones(*), type_pdv:type_pdv(*)')
    .eq('societe_id', societeId)
    .eq('is_archived', false)
    .order('nom_pdv');

  if (error) {
    toast.error('Erreur chargement clients', { description: error.message });
    throw error;
  }
  return data || [];
}

export function useClients() {
  const { user } = useAuth();
  const supabase = createClient();

  const cacheKey = user?.societe?.id ? ['clients', user.societe.id] : null;

  const { data, error, isLoading, mutate } = useSWR<Client[]>(
    cacheKey,
    () => fetchClients(user!.societe.id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const clients = data || [];
  const loading = isLoading;

  const addClient = async (values: ClientValues) => {
    if (!user) return;
    const { error } = await supabase.from('clients').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    mutate();
  };

  const updateClient = async (id: string, values: ClientValues) => {
    const { error } = await supabase.from('clients').update(values).eq('id', id);
    if (error) throw error;
    mutate();
  };

  const archiveClient = async (id: string) => {
    const { error } = await supabase.from('clients').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    mutate();
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    archiveClient,
    refresh: () => mutate(),
  };
}
