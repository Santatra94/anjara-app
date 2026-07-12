'use client';

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  AlertTriangle,
  CreditCard,
  Calendar as CalendarIcon,
  Clock,
  Wallet
} from "lucide-react";
import { DatePicker } from "@/components/shared/DatePicker";
import { format, addDays } from "date-fns";
import { PromesseRecouvrement } from "@/types/database.types";

interface PromesseFull extends PromesseRecouvrement {
    commande: {
        code_commande: string | null;
        client: { nom_pdv: string } | null;
    } | null;
}

export function RecouvrementForm({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [promesse, setPromesse] = useState<PromesseFull | null>(null);
  const [loading, setLoading] = useState(true);

  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<string>("ESPECES");
  const [dateProchaineVisite, setDateProchaineVisite] = useState<Date | undefined>(addDays(new Date(), 2));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPromesse = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
        .from('promesses_recouvrement')
        .select(`
            *,
            commande:commandes(code_commande, client:clients(nom_pdv))
        `)
        .eq('id', id)
        .single();

    if (data) {
        setPromesse(data as unknown as PromesseFull);
        setMontantRecu(data.montant_promis || 0);
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
      fetchPromesse();
  }, [fetchPromesse]);

  if (loading) return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-orange-500" /></div>;
  if (!promesse) return <div className="p-8 text-center text-red-500">Promesse non trouvée</div>;

  const detteRestante = promesse.montant_promis || 0;
  const resteAPresPaiement = Math.max(0, detteRestante - montantRecu);

  const handleValider = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast.error("Impossible hors ligne");
      return;
    }

    setSubmitting(true);

        try {
      // 1. Créer le recouvrement
      const { error: recError } = await supabase.from('recouvrements').insert([{
        commande_id: promesse.commande_id,
        livreur_id: user?.id,
        societe_id: user?.societe.id,
        montant_recouvre: montantRecu,
        mode_paiement: modePaiement,
        notes: notes,
      }]);
      if (recError) throw recError;

      // 2. Mettre à jour la promesse actuelle
      const nouveauStatut = montantRecu === 0 ? 'REPORTEE'
                          : montantRecu >= detteRestante ? 'HONOREE_COMPLETE'
                          : 'HONOREE_PARTIELLE';

      const updateData: Partial<PromesseRecouvrement> = {
        statut: nouveauStatut,
        date_effective: new Date().toISOString().split('T')[0],
        montant_effectif: montantRecu,
      };

      const { error: updateError } = await supabase
        .from('promesses_recouvrement')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // 3. Si reste de la dette → nouvelle promesse
      if (resteAPresPaiement > 0 && dateProchaineVisite) {
        await supabase.from('promesses_recouvrement').insert([{
          encaissement_id: promesse.encaissement_id,
          commande_id: promesse.commande_id,
          societe_id: user?.societe.id,
          livreur_id: user?.id,
          date_prevue: format(dateProchaineVisite, 'yyyy-MM-dd'),
          montant_promis: resteAPresPaiement,
          statut: 'EN_ATTENTE',
          notes: `Suite au recouvrement partiel de ${montantRecu} Ar. ${notes}`
        }]);
      }

      toast.success("Recouvrement enregistré !");
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Erreur", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black tracking-tight">Recouvrement Dette</h1>
      </div>

      <Card className="border-none shadow-none bg-orange-500 text-white rounded-3xl overflow-hidden">
         <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Client</p>
                    <h2 className="text-2xl font-black leading-tight">{promesse.commande?.client?.nom_pdv}</h2>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">
                    {promesse.commande?.code_commande}
                </div>
            </div>
            <div className="pt-4 border-t border-white/10">
                <p className="text-orange-100 text-[10px] font-bold uppercase">Dette à recouvrer</p>
                <p className="text-3xl font-black">{detteRestante.toLocaleString()} Ar</p>
            </div>
         </CardContent>
      </Card>

      <div className="space-y-4 pb-10">
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-1.5">
                <Wallet className="h-3 w-3" /> Montant reçu
            </label>
            <Input
                type="number"
                className="h-14 rounded-2xl border-2 focus:border-orange-500 text-xl font-black text-orange-600"
                value={montantRecu}
                onChange={(e) => setMontantRecu(Number(e.target.value))}
            />
        </div>

        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> Mode de paiement
            </label>
            <Select onValueChange={setModePaiement} value={modePaiement}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ESPECES">Espèces</SelectItem>
                    <SelectItem value="MVOLA">Mvola</SelectItem>
                    <SelectItem value="ORANGE_MONEY">Orange</SelectItem>
                    <SelectItem value="AIRTEL_MONEY">Airtel</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {resteAPresPaiement > 0 && (
            <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-black uppercase text-sm tracking-tight italic">
                        Reliquat : {resteAPresPaiement.toLocaleString()} Ar
                    </p>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" /> Date prochain passage
                    </label>
                    <DatePicker
                        date={dateProchaineVisite}
                        setDate={setDateProchaineVisite}
                        className="h-12 rounded-xl border-amber-200 bg-white"
                    />
                </div>
            </div>
        )}

        <div className="space-y-2 pt-2">
            <label className="text-xs font-black text-gray-400 uppercase">Notes</label>
            <Input
                placeholder="Raison du paiement partiel..."
                className="h-14 rounded-2xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>

        <Button
            onClick={handleValider}
            disabled={submitting}
            className="w-full h-16 rounded-3xl bg-orange-600 hover:bg-orange-700 font-black text-lg uppercase tracking-widest shadow-xl shadow-orange-100 mt-4"
        >
            {submitting ? "Enregistrement..." : "Valider le recouvrement"}
        </Button>
      </div>
    </div>
  );
}
