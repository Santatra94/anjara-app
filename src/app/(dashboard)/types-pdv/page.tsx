'use client';

import { useState } from 'react';
import { useTypePdvs } from '@/hooks/useTypePdvs';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Store } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TypePdvFormModal } from '@/components/modules/TypePdvFormModal';
import { TypePdv } from '@/types';
import { toast } from 'sonner';
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
import { typePdvSchema } from '@/lib/schemas';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type TypePdvValues = z.infer<typeof typePdvSchema>;

export default function TypePdvsPage() {
  const { types, loading, addType, updateType, archiveType } = useTypePdvs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypePdv | null>(null);
  const [deletingType, setDeletingType] = useState<TypePdv | null>(null);

  const handleAdd = () => {
    setEditingType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type: TypePdv) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: TypePdvValues) => {
    try {
      if (editingType) {
        await updateType(editingType.id, values);
        toast.success("Type mis a jour");
      } else {
        await addType(values);
        toast.success("Type ajoute");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  const confirmArchive = async () => {
    if (!deletingType) return;
    try {
      await archiveType(deletingType.id);
      toast.success("Type archive");
      setDeletingType(null);
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Types de PDV</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Categories de points de vente.</p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un type
          </Button>
        </div>

        {/* VUE MOBILE - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map(function (_, i) {
              return <div key={i} className="h-16 animate-pulse bg-white rounded-xl border" />;
            })
          ) : types.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-white rounded-xl border">
              Aucun type trouve.
            </div>
          ) : (
            types.map(function (type) {
              return (
                <div key={type.id} className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{type.nom_type}</h3>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={function () { handleEdit(type); }}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={function () { setDeletingType(type); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
                <TableHead>Nom du type</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">Aucun type trouve.</TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.nom_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingType(type)}>
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

        <TypePdvFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          initialData={editingType}
        />

        <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver le type &quot;{deletingType?.nom_type}&quot;.
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
