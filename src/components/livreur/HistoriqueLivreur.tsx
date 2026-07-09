'use client';

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutBadge } from "@/components/commandes/StatutBadge";
import { Calendar, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Commande } from "@/types/database.types";

interface CommandeHisto extends Commande {
  client: { nom_pdv: string } | null;
}

export function HistoriqueLivreur() {
  const { user } = useAuth();
  const supabase = createClient();
  const [commandes, setCommandes] = useState<CommandeHisto[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchHistorique = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const start = format(startOfMonth(new Date(month)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(month)), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('commandes')
      .select('*, client:clients(nom_pdv)')
      .eq('livreur_assigne_id', user.id)
      .gte('date_livraison', start)
      .lte('date_livraison', end)
      .order('date_livraison', { ascending: false });

    setCommandes((data as unknown as CommandeHisto[]) || []);
    setLoading(false);
  }, [user, supabase, month]);

  useEffect(() => {
    fetchHistorique();
  }, [fetchHistorique]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <RefreshCcw className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Chargement de l&apos;historique...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight uppercase">Historique</h1>
        <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="pl-9 h-10 rounded-xl border-none shadow-sm font-bold text-sm w-[160px]"
            />
        </div>
      </div>

      {commandes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic">
              Aucune commande pour ce mois.
          </div>
      ) : (
          <div className="space-y-3">
              {commandes.map((cmd) => (
                  <Card key={cmd.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      {cmd.code_commande}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">
                                      {cmd.date_livraison ? format(new Date(cmd.date_livraison), "d MMM", { locale: fr }) : "—"}
                                  </span>
                              </div>
                              <h3 className="font-bold text-gray-900 truncate">{cmd.client?.nom_pdv}</h3>
                              <p className="text-[11px] font-black text-gray-400">{( (cmd.total_yaourt || 0) + (cmd.total_jus || 0) ).toLocaleString()} AR</p>
                          </div>
                          <div className="shrink-0">
                              <StatutBadge statut={cmd.statut} className="text-[9px] px-2 py-0.5" />
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      )}
    </div>
  );
}
