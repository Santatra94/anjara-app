'use client';

import { useState } from 'react';
import { useProduits } from '@/hooks/useProduits';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProduitFormModal } from '@/components/modules/ProduitFormModal';
import { Produit } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { produitSchema } from '@/lib/schemas';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type ProduitValues = z.infer<typeof produitSchema>;

export default function ProduitsPage() {
  const { produits, loading, addProduit, updateProduit, archiveProduit } = useProduits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [deletingProduit, setDeletingProduit] = useState<Produit | null>(null);

  const handleAdd = () => {
    setEditingProduit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: ProduitValues) => {
    try {
      if (editingProduit) {
        await updateProduit(editingProduit.id, values);
        toast.success("Produit mis à jour");
      } else {
        await addProduit(values);
        toast.success("Produit ajouté");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  const confirmArchive = async () => {
    if (!deletingProduit) return;
    try {
      await archiveProduit(deletingProduit.id);
      toast.success("Produit archivé");
      setDeletingProduit(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'GERANT']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catalogue Produits</h1>
            <p className="text-muted-foreground">Gérez vos yaourts et jus.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
          </Button>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix Vente</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : produits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Aucun produit trouvé.</TableCell>
                </TableRow>
              ) : (
                produits.map((produit) => (
                  <TableRow key={produit.id}>
                    <TableCell className="font-mono text-xs">{produit.code_produit || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{produit.nom_produit}</span>
                        {produit.saison && (
                          <span className="text-xs text-muted-foreground italic">{produit.saison}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{produit.categorie}</Badge>
                    </TableCell>
                    <TableCell>{produit.prix.toLocaleString()} Ar</TableCell>
                    <TableCell>
                      {produit.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(produit)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingProduit(produit)}>
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

        <ProduitFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          initialData={editingProduit}
        />

        <AlertDialog open={!!deletingProduit} onOpenChange={() => setDeletingProduit(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver le produit &quot;{deletingProduit?.nom_produit}&quot;. Il ne pourra plus être ajouté aux futures commandes.
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
