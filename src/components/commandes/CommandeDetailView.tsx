'use client';

import { useState } from 'react';
import { useCommandeDetail } from "@/hooks/useCommandeDetail";
import { useCommandes } from "@/hooks/useCommandes";
import { useAuth } from "@/hooks/useAuth";
import { StatutBadge } from "./StatutBadge";
import { ReassignerLivreurModal } from "./ReassignerLivreurModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, MapPin, Truck, Package, Calendar, XCircle, FileText, UserCog } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { StatutCommande } from "@/types/database.types";

function computePercent(current: number | null | undefined, target: number | null | undefined): number {
  const curr = current || 0;
  const tgt = target || 0;
  if (tgt <= 0) return 0;
  return Math.min(100, Math.round((curr / tgt) * 100));
}

function getProgressColor(percent: number): string {
  if (percent >= 81) return "bg-green-500";
  if (percent >= 41) return "bg-orange-500";
  return "bg-red-500";
}

export function CommandeDetailView({ id }: { id: string }) {
  const { commande, loading, refresh } = useCommandeDetail(id);
  const { updateStatut } = useCommandes();
  const { user } = useAuth();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Clock className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!commande) {
    return <div className="text-center py-12 text-red-500 font-bold">Commande introuvable</div>;
  }

  const handleStatusUpdate = async (statut: StatutCommande) => {
    try {
      await updateStatut(id, statut);
      toast.success("Statut mis à jour");
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

  const userRole = user?.utilisateur.role;
  const isAdminOrGerant = userRole === 'ADMIN' || userRole === 'GERANT';
  const isEditableStatus = commande.statut === 'EN_ATTENTE' || commande.statut === 'PREPARATION';
  const canReassignLivreur = isAdminOrGerant && isEditableStatus;

  const yaourtPercent = computePercent(commande.total_yaourt, commande.total_yaourt_commande);
  const jusPercent = computePercent(commande.total_jus, commande.total_jus_commande);

  const totalCommande = commande.lignes_commande
    ? commande.lignes_commande.reduce((acc, curr) => acc + (curr.total_ligne || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/commandes">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{commande.code_commande}</h1>
              <StatutBadge statut={commande.statut as StatutCommande} className="text-sm px-3 py-1" />
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Livraison le {commande.date_livraison ? format(new Date(commande.date_livraison), "EEEE d MMMM yyyy", { locale: fr }) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {commande.statut === 'EN_ATTENTE' && (
            <>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleStatusUpdate('ANNULE')}>
                <XCircle className="mr-2 h-4 w-4" /> Annuler
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/commandes/${id}/preparation`}>
                  <Package className="mr-2 h-4 w-4" /> Commencer la préparation
                </Link>
              </Button>
            </>
          )}
          {commande.statut === 'PREPARATION' && (
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => handleStatusUpdate('EN_LIVRAISON')}>
              <Truck className="mr-2 h-4 w-4" /> Passer en livraison
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" /> Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-bold text-lg">{commande.client?.nom_pdv}</p>
                <p className="text-sm text-muted-foreground italic">Type : {commande.client?.type_pdv?.nom_type}</p>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-700">Zone : {commande.client?.zone?.nom}</p>
                <p className="text-gray-600">{commande.client?.localisation || "Pas de localisation précise"}</p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase font-bold text-gray-400">Livreur assigné</p>
                  {canReassignLivreur && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReassignModalOpen(true)}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <UserCog className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {commande.livreur?.nom?.charAt(0)}
                  </div>
                  <p className="font-medium">{commande.livreur?.nom || "Non assigné"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {commande.commentaire && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
                  <FileText className="h-4 w-4" /> Note / Commentaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900">{commande.commentaire}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé de la préparation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-blue-700">Yaourts</p>
                    <p className="text-xs text-muted-foreground italic">Souhaités : {commande.parfums_yaourt_souhaites || "—"}</p>
                  </div>
                  <p className="text-sm font-bold">
                    {commande.total_yaourt || 0} / {commande.total_yaourt_commande || 0} préparés
                  </p>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(yaourtPercent)}`} style={{ width: `${yaourtPercent}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-orange-700">Jus</p>
                    <p className="text-xs text-muted-foreground italic">Souhaités : {commande.parfums_jus_souhaites || "—"}</p>
                  </div>
                  <p className="text-sm font-bold">
                    {commande.total_jus || 0} / {commande.total_jus_commande || 0} préparés
                  </p>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${getProgressColor(jusPercent)}`} style={{ width: `${jusPercent}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Détail des produits préparés</CardTitle>
              {isEditableStatus && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/commandes/${id}/preparation`}>Modifier</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!commande.lignes_commande || commande.lignes_commande.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                        Aucun produit n&apos;a encore été préparé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commande.lignes_commande.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell className="font-medium">{ligne.produit?.nom_produit}</TableCell>
                        <TableCell>
                          <span className="text-xs uppercase font-bold text-gray-400">{ligne.categorie}</span>
                        </TableCell>
                        <TableCell className="text-right font-bold">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{(ligne.prix_unitaire || 0).toLocaleString()} Ar</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {(ligne.total_ligne || 0).toLocaleString()} Ar
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {commande.lignes_commande && commande.lignes_commande.length > 0 && (
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell colSpan={4} className="text-right uppercase text-xs tracking-wider">Total Commande Réel</TableCell>
                      <TableCell className="text-right text-lg text-blue-700">
                        {totalCommande.toLocaleString()} Ar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <ReassignerLivreurModal
        open={reassignModalOpen}
        onOpenChange={setReassignModalOpen}
        commandeId={id}
        currentLivreurId={commande.livreur_assigne_id}
        onSuccess={refresh}
      />
    </div>
  );
}
