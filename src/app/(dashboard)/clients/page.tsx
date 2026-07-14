'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MapPin, Phone, Store, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientFormModal } from '@/components/modules/ClientFormModal';
import { Client } from '@/types';
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
import { clientSchema } from '@/lib/schemas';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type ClientValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, archiveClient } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const handleAdd = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: ClientValues) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, values);
        toast.success("Client mis a jour");
      } else {
        await addClient(values);
        toast.success("Client ajoute");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  const confirmArchive = async () => {
    if (!deletingClient) return;
    try {
      await archiveClient(deletingClient.id);
      toast.success("Client archive");
      setDeletingClient(null);
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Clients (PDV)</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Gerez vos points de vente.</p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un client
          </Button>
        </div>

        {/* VUE MOBILE - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map(function (_, i) {
              return (
                <div key={i} className="h-32 animate-pulse bg-white rounded-xl border" />
              );
            })
          ) : clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-white rounded-xl border">
              Aucun client trouve.
            </div>
          ) : (
            clients.map(function (client) {
              return (
                <div key={client.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{client.nom_pdv}</h3>
                        <p className="text-xs text-gray-500 font-mono">{client.code_client || "—"}</p>
                      </div>
                      {client.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shrink-0">Actif</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Inactif</Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 border-t pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Store className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-600">{client.type_pdv?.nom_type || "—"}</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700">{client.zone?.nom || "—"}</p>
                          {client.localisation && (
                            <p className="text-xs text-gray-500 truncate">{client.localisation}</p>
                          )}
                        </div>
                      </div>

                      {client.nom_responsable && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-gray-600">{client.nom_responsable}</span>
                        </div>
                      )}

                      {client.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                          <a href={'tel:' + client.telephone} className="text-blue-600">{client.telephone}</a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 border-t pt-3">
                      <Button variant="outline" size="sm" onClick={function () { handleEdit(client); }} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={function () { setDeletingClient(client); }} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
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
                <TableHead>Point de Vente</TableHead>
                <TableHead>Zone / Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Aucun client trouve.</TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">{client.code_client || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{client.nom_pdv}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.type_pdv?.nom_type || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">{client.zone?.nom || "—"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {client.localisation || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{client.nom_responsable || "—"}</span>
                        {client.telephone && (
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Phone className="h-3 w-3" />
                            {client.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.actif ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingClient(client)}>
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

        <ClientFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleSubmit}
          initialData={editingClient}
        />

        <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Etes-vous sur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va archiver le client &quot;{deletingClient?.nom_pdv}&quot;. Il ne sera plus visible dans la liste des commandes.
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
