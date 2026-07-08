'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Zone } from '@/types';
import { toast } from 'sonner';

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchZones = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('societe_id', user.societe.id)
      .eq('is_archived', false)
      .order('nom');

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setZones(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const addZone = async (values: { nom: string; ville?: string | null }) => {
    if (!user) return;
    const { error } = await supabase.from('zones').insert([{
      ...values,
      societe_id: user.societe.id
    }]);
    if (error) throw error;
    fetchZones();
  };

  const updateZone = async (id: string, values: { nom: string; ville?: string | null }) => {
    const { error } = await supabase.from('zones').update(values).eq('id', id);
    if (error) throw error;
    fetchZones();
  };

  const archiveZone = async (id: string) => {
    const { error } = await supabase.from('zones').update({ is_archived: true }).eq('id', id);
    if (error) throw error;
    fetchZones();
  };

  return { zones, loading, addZone, updateZone, archiveZone, refresh: fetchZones };
}
