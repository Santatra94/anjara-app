'use client';

import { useState } from 'react';
import { useCommandeDetail } from "@/hooks/useCommandeDetail";
import { useCommandes } from "@/hooks/useCommandes";
import { useAuth } from "@/hooks/useAuth";
import { StatutBadge } from "./StatutBadge";
import { ReassignerLivreurModal } from "./ReassignerLivreurModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Truck,
  Package,
  Calendar,
  XCircle,
  FileText,
  UserCog
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { StatutCommande } from "@/types/database.types";

export function CommandeDetailView({ id }: { id: string }) {
  const { commande, loading, refresh } = useCommandeDetail(id);
  const { updateStatut } = useCommandes();
  const { user } = useAuth();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  if (loading) return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-blue-500" /></div>;
  if (!commande) return <div className="text-center py-12 text-red-500 font-bold">Commande introuvable</div>;

  const handleStatusUpdate = async (statut: StatutCommande) => {
    try {
      await updateStatut(id, statut);
      toast.success(`Statut mis à jour : ${statut}`);
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur", { description: message });
    }
  };

    // Vérifier si l'utilisateur peut réassigner
  const userRole = user?.utilisateur.role;
  const isAdminOrGerant = userRole === 'ADMIN' || userRole === 'GERANT';
  const isEditableStatus = commande.statut === 'EN_ATTENTE' || commande.statut === 'PREPARATION';
  const canReassignLivreur = isAdminOrGerant && isEditableStatus;

  const getProgressColor = (percent: number) => {
    if (percent >= 81) return "bg-green-500";
    if (percent >= 41) return "bg-orange-500";
    return "bg-red-500";
  };

  const yaourtPercent = (commande.total_yaourt_commande ?? 0) > 0
    ? Math.min(100, Math.round(((commande.total_yaourt ?? 0) / (commande.total_yaourt_commande ?? 0)) * 100))
    : 0;

  const jusPercent = (commande.total_jus_commande ?? 0) > 0
    ? Math.min(100, Math.round(((commande.total_jus ?? 0) / (commande.total_jus_commande ?? 0)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header avec Actions */}
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
        {/* Infos Client & Livreur */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" /> Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p 
