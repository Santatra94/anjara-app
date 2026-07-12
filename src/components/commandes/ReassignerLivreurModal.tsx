'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';

interface Livreur {
  id: string;
  nom: string;
  zone: { nom: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandeId: string;
  currentLivreurId: string | null;
  onSuccess: () => void;
}

export function ReassignerLivreurModal({
  open,
  onOpenChange,
  commandeId,
  currentLivreurId,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const supabase = createClient();

  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [selectedLivreurId, setSelectedLivreurId] = useState<string>(currentLivreurId || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    async function fetchLivreurs() {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, zone:zones(nom)')
        .eq('societe_id', user.societe.id)
        .eq('role', 'LIVREUR')
        .eq('actif', true)
        .eq('is_archived', false)
        .order('nom');

      if (error) {
        toast.error('Erreur', { description: error.message });
      } else {
        setLivreurs((data as unknown as Livreur[]) || []);
      }
      setLoading(false);
    }

    fetchLivreurs();
    setSelectedLivreurId(currentLivreurId || '');
  }, [open, user, currentLivreurId, supabase]);

  const handleSave = async () => {
    if (!selectedLivreurId) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }

    if (selectedLivreurId === currentLivreurId) {
      toast.info('Aucun changement');
      onOpenChange(false);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('commandes')
      .update({ livreur_assigne_id: selectedLivreurId })
      .eq('id', commandeId);

    if (error) {
      toast.error('Erreur', { description: error.message });
    } else {
      toast.success('Livreur réassigné avec succès');
      onSuccess();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Réassigner le livreur
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Choisir un livreur
            </label>
            <Select
              value={selectedLivreurId}
              onValueChange={setSelectedLivreurId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Chargement...' : 'Sélectionner un livreur'} />
              </SelectTrigger>
              <SelectContent>
                {livreurs.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nom} {l.zone?.nom && `(${l.zone.nom})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Seuls les livreurs actifs de votre société sont affichés.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
