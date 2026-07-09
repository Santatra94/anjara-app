'use client';

import { useCaisse } from "@/hooks/useCaisse";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Wallet, TrendingUp, History, RefreshCcw, Truck } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Transaction {
    type: 'LIVRAISON' | 'RECOUVREMENT';
    montant_encaisse?: number | null;
    montant_recouvre?: number | null;
    mode_paiement?: string | null;
    created_at?: string | null;
    commande: {
        code_commande: string | null;
        client: { nom_pdv: string } | null;
    } | null;
}

export function MaCaisse() {
  const { user } = useAuth();
  const { data: synthese, loading } = useCaisse();
  const supabase = createClient();
  const [details, setDetails] = useState<Transaction[]>([]);

  const fetchDetails = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Livraisons
    const { data: livData } = await supabase
        .from('encaissements')
        .select('*, commande:commandes(code_commande, client:clients(nom_pdv))')
        .eq('societe_id', user.societe.id)
        .gte('date_encaissement', today + 'T00:00:00')
        .lte('date_encaissement', today + 'T23:59:59');

    // Recouvrements
    const { data: recData } = await supabase
        .from('recouvrements')
        .select('*, commande:commandes(code_commande, client:clients(nom_pdv))')
        .eq('societe_id', user.societe.id)
        .eq('livreur_id', user.id)
        .eq('date_recouvrement', today);

    const all = [
        ...(livData?.map(d => ({ ...d, type: 'LIVRAISON' })) || []),
        ...(recData?.map(d => ({ ...d, type: 'RECOUVREMENT' })) || [])
    ];

    const sorted = all.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    });

    setDetails(sorted as unknown as Transaction[]);
  }, [user, supabase]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <RefreshCcw className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Calcul de votre caisse...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Ma Caisse du jour</h2>
        <p className="text-lg font-bold">{format(new Date(), "EEEE d MMMM", { locale: fr })}</p>
      </div>

      <Card className="bg-blue-600 text-white border-none shadow-xl shadow-blue-100 rounded-3xl">
        <CardContent className="p-8 text-center">
            <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-6 w-6" />
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Total à reverser</p>
            <h3 className="text-4xl font-black">{(synthese?.total_a_reverser || 0).toLocaleString()} Ar</h3>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none bg-white rounded-2xl shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Livraisons</span>
                </div>
                <p className="text-xl font-black">{(synthese?.total_encaissements_jour || 0).toLocaleString()} Ar</p>
            </CardContent>
        </Card>
        <Card className="border-none bg-white rounded-2xl shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                    <History className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">Recouvr.</span>
                </div>
                <p className="text-xl font-black">{(synthese?.total_recouvrements_jour || 0).toLocaleString()} Ar</p>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Détail des transactions</h3>
        {details.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400 text-sm">
                Aucune transaction aujourd&apos;hui
            </div>
        ) : (
            <div className="space-y-3 pb-10">
                {details.map((item, idx) => (
                    <Card key={idx} className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'LIVRAISON' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {item.type === 'LIVRAISON' ? <Truck className="h-5 w-5" /> : <History className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm leading-tight">{item.commande?.client?.nom_pdv}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.commande?.code_commande} · {item.mode_paiement}</p>
                                </div>
                            </div>
                            <div className="text-right font-black text-sm">
                                {(item.montant_encaisse || item.montant_recouvre || 0).toLocaleString()} Ar
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
