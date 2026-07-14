'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLivreurs } from '@/hooks/useLivreurs';
import { Utilisateur } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MapPin, Phone, Mail, Truck } from 'lucide-react';
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
      toast.success(editingLivreur ? "Livreur mis a jour" : "Livreur cree");
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
      toast.success("Livreur archive");
      refresh();
    }
    setDeletingLivreur(null);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'GERANT']}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Livreurs</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Gerez votre equipe de livraison.</p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un livreur
          </Button>
        </div>

        {/* VUE MOBILE - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map(function (_, i) {
              return (
                <div key={i} className="h-32 animate-pulse bg-white rounded-xl border" />
              );
            })
          ) : livreurs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-white rounded-xl border">
              Aucun livreur trouve.
            </div>
          ) : (
            livreurs.map(function (livreur) {
              return (
                <div key={livreur.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{livreur.nom}</h3>
                          <p className="text-xs text-gray-500 truncate">{livreur.email}</p>
                        </div>
                      </div>
                      {livreur.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shrink-0">Actif</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Inactif</Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 border-t pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-700 font-medium">
                          {livreur.zone?.nom || <span className="text-amber-600 italic">Non assigne</span>}
                        </span>
                      </div>

                      {livreur.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                          <a href={'tel:' + livreur.telephone} className="text-blue-600">{livreur.telephone}</a>
                        </div>
                      )}

                      {livreur.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                          <a href={'mailto:' + livreur.email} className="text-blue-600 truncate">{livreur.email}</a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 border-t pt-3">
                      <Button variant="outline" size="sm" onClick={function () { handleEdit(livreur); }} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={function () { setDeletingLivreur(livreur); }} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" /> Archiver
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VUE DESKTOP - Tableau */}
        <div className="hidden md:block rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Zone Assignee</TableHead>
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
                  <TableCell colSpan={5} className="text-center py-8">Aucun livreur trouve.</TableCell>
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
                        {livreur.zone?.nom || "Non assigne"}
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
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver le livreur &quot;{deletingLivreur?.nom}&quot;. Il ne pourra plus se connecter ni etre assigne a des commandes.
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
