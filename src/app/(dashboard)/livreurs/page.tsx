'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLivreurs } from '@/hooks/useLivreurs';
import { Utilisateur } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LivreurFormModal } from '@/components/modules/LivreurFormModal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { createLivreurAction, updateLivreurAction } from './actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { z } from 'zod';
import { livreurSchema } from '@/lib/schemas';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';

type LivreurValues = z.infer<typeof livreurSchema>;

export default function LivreursPage() {
  const { user } = useAuth();
  const { livreurs, loading, refresh } = useLivreurs();
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLivreur, setEditingLivreur] = useState<Utilisateur | null>(null);
  const [deletingLivreur, setDeletingLivreur] = useState<Utilisateur | null>(null);

  const handleAdd = () => {
    setEditingLivreur(null);
    setIsModalOpen(true);
  };

  const handleEdit = (livreur: Utilisateur) => {
    setEditingLivreur(livreur);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: LivreurValues) => {
    if (!user) return;

    let result;
    if (editingLivreur) {
      result = await updateLivreurAction(editingLivreur.id, values);
    } else {
      result = await createLivreurAction(values, user.societe.id);
    }

    if (result.success) {
      toast.success(editingLivreur ? "Livreur mis à jour" : "Livreur créé");
      refresh();
    } else {
      toast.error("Erreur", { description: result.error });
    }
  };

  const confirmArchive = async () => {
    if (!deletingLivreur) return;
    const { error } = await supabase
        .from('utilisateurs')
        .update({ is_archived: true })
        .eq('id', deletingLivreur.id);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success("Livreur archivé");
      refresh();
    }
    setDeletingLivreur(null);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'GERANT']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Livreurs</h1>
            <p className="text-muted-foreground">Gérez votre équipe de livraison et leurs accès.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un livreur
          </Button>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Zone Assignée</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : livreurs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Aucun livreur trouvé.</TableCell>
                </TableRow>
              ) : (
                livreurs.map((livreur) => (
                  <TableRow key={livreur.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{livreur.nom}</span>
                        <span className="text-xs text-muted-foreground">{livreur.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {livreur.zone?.nom || "Non assigné"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {livreur.telephone ? (
                        <div className="flex items-center text-sm gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {livreur.telephone}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {livreur.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(livreur)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingLivreur(livreur)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <LivreurFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          initialData={editingLivreur}
        />

          <AlertDialog open={!!deletingLivreur} onOpenChange={() => setDeletingLivreur(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Cette action va archiver le livreur &quot;{deletingLivreur?.nom}&quot;. Il ne pourra plus se connecter ni être assigné à des commandes.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmArchive} className="bg-red-600 hover:bg-red-700">
                          Archiver
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
