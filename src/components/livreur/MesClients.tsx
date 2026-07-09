'use client';

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/types/database.types";

interface ClientWithDette extends Client {
    dettes: { dette_actuelle: number | null }[];
}

export function MesClients() {
  const { user } = useAuth();
  const supabase = createClient();
  const [clients, setClients] = useState<ClientWithDette[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClients() {
        if (!user) return;
        setLoading(true);

        // 1. Get livreur zone
        const { data: profil } = await supabase.from('utilisateurs').select('zone_id').eq('id', user.id).single();

        if (profil?.zone_id) {
            const { data } = await supabase
              .from('clients')
              .select('*, dettes:v_clients_dettes(dette_actuelle)')
              .eq('zone_id', profil.zone_id)
              .eq('is_archived', false)
              .order('nom_pdv');

            setClients((data as unknown as ClientWithDette[]) || []);
        }
        setLoading(false);
    }
    fetchClients();
  }, [user, supabase]);

  const filteredClients = clients.filter(c =>
    c.nom_pdv.toLowerCase().includes(search.toLowerCase()) ||
    (c.code_client || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <RefreshCcw className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Chargement de vos clients...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight uppercase">Mes Clients</h1>
        <Badge variant="outline" className="rounded-full font-bold">{clients.length} au total</Badge>
      </div>

      <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            className="h-14 rounded-2xl pl-12 border-none shadow-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
      </div>

      <div className="space-y-4 pb-20">
        {filteredClients.map((client) => {
            const dette = client.dettes?.[0]?.dette_actuelle || 0;
            return (
                <Card key={client.id} className="border-none shadow-md shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-900 leading-tight">{client.nom_pdv}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{client.code_client}</p>
                            </div>
                            {dette > 0 && (
                                <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl flex flex-col items-end">
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Dette</span>
                                    <span className="text-xs font-black">{dette.toLocaleString()} Ar</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                <MapPin className="h-4 w-4 text-blue-400" />
                                <span className="truncate">{client.localisation || "—"}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                                asChild
                            >
                                <a href={`tel:${client.telephone}`}>
                                    <Phone className="mr-2 h-4 w-4" /> Appeler
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
      </div>
    </div>
  );
}
