'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Client } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientSchema } from '@/lib/schemas';

type ClientValues = z.infer<typeof clientSchema>;

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // On select les relations pour l'affichage
    const { data, error } = await supabase
      .from('clients')
      .select('*, zone:zones(*), type_pdv:type_pdv(*)')
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .order('nom_pdv');

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (values: ClientValues) => {
    if (!user) return;
    const { error } = await supabase.from('clients').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    fetchClients();
  };

  const updateClient = async (id: string, values: ClientValues) => {
    const { error } = await supabase.from('clients').update(values).eq('id', id);
    if (error) throw error;
    fetchClients();
  };

  const archiveClient = async (id: string) => {
    const { error } = await supabase.from('clients').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    fetchClients();
  };

  return { clients, loading, addClient, updateClient, archiveClient, refresh: fetchClients };
}
