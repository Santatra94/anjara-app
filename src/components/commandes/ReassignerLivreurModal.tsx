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
  role: string;
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
        .select('id, nom, role, zone:zones(nom)')
        .eq('societe_id', user.societe.id)
        .in('role', ['LIVREUR', 'ADMIN', 'GERANT'])
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
      toast.error('Veuillez selectionner un livreur');
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
      toast.success('Livreur reassigne avec succes');
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
            Reassigner le livreur
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
                <SelectValue placeholder={loading ? 'Chargement...' : 'Selectionner un livreur'} />
              </SelectTrigger>
              <SelectContent>
                {livreurs.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex items-center gap-2">
                      <span>{l.nom}</span>
                      <span className="text-xs text-gray-400 uppercase">
                        ({l.role}){l.zone?.nom ? ' - ' + l.zone.nom : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Les livreurs, admins et gerants actifs de votre societe sont affiches.
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