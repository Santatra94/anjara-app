'use client';

import { useState } from 'react';
import { useZones } from '@/hooks/useZones';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ZoneFormModal } from '@/components/modules/ZoneFormModal';
import { Zone } from '@/types';
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
import { zoneSchema } from '@/lib/schemas';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type ZoneValues = z.infer<typeof zoneSchema>;

export default function ZonesPage() {
  const { zones, loading, addZone, updateZone, archiveZone } = useZones();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);

  const handleAdd = () => {
    setEditingZone(null);
    setIsModalOpen(true);
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: ZoneValues) => {
    try {
      if (editingZone) {
        await updateZone(editingZone.id, values);
        toast.success("Zone mise a jour");
      } else {
        await addZone(values);
        toast.success("Zone ajoutee");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  const confirmArchive = async () => {
    if (!deletingZone) return;
    try {
      await archiveZone(deletingZone.id);
      toast.success("Zone archivee");
      setDeletingZone(null);
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Zones geographiques</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Secteurs de livraison.</p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter une zone
          </Button>
        </div>

        {/* VUE MOBILE - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map(function (_, i) {
              return <div key={i} className="h-20 animate-pulse bg-white rounded-xl border" />;
            })
          ) : zones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-white rounded-xl border">
              Aucune zone trouvee.
            </div>
          ) : (
            zones.map(function (zone) {
              return (
                <div key={zone.id} className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{zone.nom}</h3>
                      <p className="text-xs text-gray-500">{zone.ville || "—"}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={function () { handleEdit(zone); }}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={function () { setDeletingZone(zone); }}>
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
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Aucune zone trouvee.</TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.nom}</TableCell>
                    <TableCell>{zone.ville || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingZone(zone)}>
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

        <ZoneFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          initialData={editingZone}
        />

        <AlertDialog open={!!deletingZone} onOpenChange={() => setDeletingZone(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver la zone &quot;{deletingZone?.nom}&quot;.
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
