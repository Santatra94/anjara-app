'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TypePdv } from '@/types';
import { toast } from 'sonner';

export function useTypePdvs() {
  const [types, setTypes] = useState<TypePdv[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchTypes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('type_pdv')
      .select('*')
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .order('nom_type');

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setTypes(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const addType = async (values: { nom_type: string }) => {
    if (!user) return;
    const { error } = await supabase.from('type_pdv').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    fetchTypes();
  };

  const updateType = async (id: string, values: { nom_type: string }) => {
    const { error } = await supabase.from('type_pdv').update(values).eq('id', id);
    if (error) throw error;
    fetchTypes();
  };

  const archiveType = async (id: string) => {
    const { error } = await supabase.from('type_pdv').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    fetchTypes();
  };

  return { types, loading, addType, updateType, archiveType, refresh: fetchTypes };
}
