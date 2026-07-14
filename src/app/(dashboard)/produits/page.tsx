'use client';

import { useState } from 'react';
import { useProduits } from '@/hooks/useProduits';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
        toast.success("Produit mis a jour");
      } else {
        await addProduit(values);
        toast.success("Produit ajoute");
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
      toast.success("Produit archive");
      setDeletingProduit(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'GERANT']}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Catalogue Produits</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Gerez vos yaourts et jus.</p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
          </Button>
        </div>

        {/* VUE MOBILE - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map(function (_, i) {
              return <div key={i} className="h-28 animate-pulse bg-white rounded-xl border" />;
            })
          ) : produits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-white rounded-xl border">
              Aucun produit trouve.
            </div>
          ) : (
            produits.map(function (produit) {
              const isYaourt = produit.categorie === 'YAOURT';
              return (
                <div key={produit.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={'w-12 h-12 rounded-full flex items-center justify-center shrink-0 ' + (isYaourt ? 'bg-blue-100' : 'bg-orange-100')}>
                          <Package className={'h-6 w-6 ' + (isYaourt ? 'text-blue-600' : 'text-orange-600')} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{produit.nom_produit}</h3>
                          <p className="text-xs text-gray-500 font-mono">{produit.code_produit || "—"}</p>
                        </div>
                      </div>
                      {produit.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shrink-0">Actif</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Inactif</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <Badge variant="outline">{produit.categorie}</Badge>
                      <p className="text-lg font-bold text-gray-900">
                        {produit.prix.toLocaleString()} <span className="text-xs text-gray-500">Ar</span>
                      </p>
                    </div>

                    {produit.saison && (
                      <p className="text-xs text-gray-500 italic">Saison : {produit.saison}</p>
                    )}

                    <div className="flex gap-2 border-t pt-3">
                      <Button variant="outline" size="sm" onClick={function () { handleEdit(produit); }} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={function () { setDeletingProduit(produit); }} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
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
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Categorie</TableHead>
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
                  <TableCell colSpan={6} className="text-center py-8">Aucun produit trouve.</TableCell>
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
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver le produit &quot;{deletingProduit?.nom_produit}&quot;. Il ne pourra plus etre ajoute aux futures commandes.
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
