'use client';

import { useCommandeDetail } from "@/hooks/useCommandeDetail";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
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
  CheckCircle2,
  AlertTriangle,
  User,
  CreditCard,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react";
import { DatePicker } from "@/components/shared/DatePicker";
import { format, addDays } from "date-fns";

export function LivraisonForm({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { commande, loading } = useCommandeDetail(id);

  const [nomReceptionnaire, setNomReceptionnaire] = useState("");
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<string>("ESPECES");
  const [dateProchaineVisite, setDateProchaineVisite] = useState<Date | undefined>(addDays(new Date(), 2));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-blue-500" /></div>;
  if (!commande) return <div className="p-8 text-center text-red-500">Commande non trouvée</div>;

  const totalAEncaisser = commande.lignes_commande?.reduce((acc: number, curr: { total_ligne: number | null }) => acc + (curr.total_ligne || 0), 0) || 0;
  const resteAPayer = Math.max(0, totalAEncaisser - montantRecu);

  const handleValider = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast.error("Impossible de valider hors ligne. Attendez le retour du réseau.");
      return;
    }

    if (!nomReceptionnaire) {
        toast.error("Veuillez saisir le nom du réceptionnaire");
        return;
    }

    setSubmitting(true);

    try {
      // 1. Update encaissement
      const { error: encError } = await supabase
        .from('encaissements')
        .update({ montant_encaisse: montantRecu })
        .eq('commande_id', id);

      if (encError) throw encError;

      // 2. Update commande
      const { error: cmdError } = await supabase
        .from('commandes')
        .update({
          statut: resteAPayer === 0 ? 'LIVRE_PAYE' : 'LIVRE_DETTE',
          date_livraison_effective: new Date().toISOString(),
          nom_receptionnaire: nomReceptionnaire,
          mode_paiement_livraison: modePaiement,
        })
        .eq('id', id);

      if (cmdError) throw cmdError;

      // 3. Create promesse if debt
      if (resteAPayer > 0 && dateProchaineVisite) {
        const { data: encData } = await supabase.from('encaissements').select('id').eq('commande_id', id).single();

        if (encData) {
            await supabase.from('promesses_recouvrement').insert([{
              encaissement_id: encData.id,
              commande_id: id,
              societe_id: user?.societe.id,
              livreur_id: user?.id,
              date_prevue: format(dateProchaineVisite, 'yyyy-MM-dd'),
              montant_promis: resteAPayer,
              statut: 'EN_ATTENTE',
              notes: notes
            }]);
        }
      }

      toast.success("Livraison enregistrée !");
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Erreur lors de la validation", { description: message });
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
        <h1 className="text-xl font-black tracking-tight">Validation Livraison</h1>
      </div>

      <Card className="border-none shadow-none bg-blue-600 text-white rounded-3xl overflow-hidden">
         <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Client</p>
                    <h2 className="text-2xl font-black leading-tight">{commande.client?.nom_pdv}</h2>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">
                    {commande.code_commande}
                </div>
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                    <p className="text-blue-200 text-[10px] font-bold uppercase">Total à encaisser</p>
                    <p className="text-3xl font-black">{totalAEncaisser.toLocaleString()} Ar</p>
                </div>
                <div className="text-right">
                    <p className="text-blue-200 text-[10px] font-bold uppercase">Zone</p>
                    <p className="font-bold text-sm">{commande.client?.zone?.nom}</p>
                </div>
            </div>
         </CardContent>
      </Card>

      <div className="space-y-4 pb-10">
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-1.5">
                <User className="h-3 w-3" /> Réceptionnaire
            </label>
            <Input
                placeholder="Nom de la personne qui reçoit"
                className="h-14 rounded-2xl border-2 focus:border-blue-600 text-lg font-bold"
                value={nomReceptionnaire}
                onChange={(e) => setNomReceptionnaire(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Montant Reçu
                </label>
                <Input
                    type="number"
                    className="h-14 rounded-2xl border-2 focus:border-blue-600 text-xl font-black text-blue-600"
                    value={montantRecu}
                    onChange={(e) => setMontantRecu(Number(e.target.value))}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3" /> Mode
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
        </div>

        {resteAPayer > 0 && (
            <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-black uppercase text-sm tracking-tight">Reste à payer : {resteAPayer.toLocaleString()} Ar</p>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" /> Prochaine visite prévue
                    </label>
                    <DatePicker
                        date={dateProchaineVisite}
                        setDate={setDateProchaineVisite}
                        className="h-12 rounded-xl border-red-200 bg-white"
                    />
                </div>
            </div>
        )}

        <div className="space-y-2 pt-2">
            <label className="text-xs font-black text-gray-400 uppercase">Notes (optionnel)</label>
            <Input
                placeholder="Précisions sur la livraison..."
                className="h-14 rounded-2xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>

        <Button
            onClick={handleValider}
            disabled={submitting || !nomReceptionnaire}
            className="w-full h-16 rounded-3xl bg-green-600 hover:bg-green-700 font-black text-lg uppercase tracking-widest shadow-xl shadow-green-100 mt-4"
        >
            {submitting ? "Validation..." : "Valider la livraison"}
        </Button>
      </div>
    </div>
  );
}
