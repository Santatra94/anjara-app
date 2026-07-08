'use client';

import { useState } from 'react';
import { useCommandes, CommandeWithRelations } from "@/hooks/useCommandes";
import { StatutBadge } from "./StatutBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Package, Truck, Filter } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutCommande } from '@/types/database.types';

export function CommandesList() {
  const [filters, setFilters] = useState<{
    statut?: StatutCommande;
    date_livraison?: string;
    search: string;
  }>({
    statut: undefined,
    date_livraison: undefined,
    search: ""
  });

  const { commandes, loading } = useCommandes(filters);

  const handleFilterChange = (key: string, value: string | undefined | null) => {
    setFilters((prev) => ({ ...prev, [key]: (value === "all" || !value) ? undefined : value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Commandes</h1>
          <p className="text-muted-foreground text-sm">Suivi du cycle de vie des commandes clients.</p>
        </div>
        <Button asChild size="lg" className="shadow-md">
          <Link href="/commandes/nouvelle">
            <Plus className="mr-2 h-5 w-5" /> Nouvelle commande
          </Link>
        </Button>
      </div>

      {/* Barre de Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Code ou client..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <Select onValueChange={(v) => handleFilterChange("statut", v)} value={(filters.statut as string) || "all"}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Tous les statuts" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="EN_ATTENTE">En attente</SelectItem>
            <SelectItem value="PREPARATION">Préparation</SelectItem>
            <SelectItem value="EN_LIVRAISON">En livraison</SelectItem>
            <SelectItem value="LIVRE_PAYE">Livré (Payé)</SelectItem>
            <SelectItem value="LIVRE_DETTE">Livré (Dette)</SelectItem>
            <SelectItem value="ANNULE">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.date_livraison || ""}
          onChange={(e) => handleFilterChange("date_livraison", e.target.value)}
          className="w-full"
        />

        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ statut: undefined, date_livraison: undefined, search: "" })}
            >
                Réinitialiser
            </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Date Livr.</TableHead>
              <TableHead className="text-right">Demande (Y|J)</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="h-12 animate-pulse bg-gray-50/50" />
                </TableRow>
              ))
            ) : commandes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                  Aucune commande trouvée.
                </TableCell>
              </TableRow>
            ) : (
              commandes.map((commande: CommandeWithRelations) => (
                <TableRow key={commande.id} className="group">
                  <TableCell className="font-mono text-xs font-bold text-blue-600">
                    {commande.code_commande}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{commande.client?.nom_pdv}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="h-3 w-3" />
                      {commande.livreur?.nom || <span className="text-amber-500 italic">Non assigné</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {commande.date_livraison ? format(new Date(commande.date_livraison), "dd MMM", { locale: fr }) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="font-semibold text-blue-700">{commande.total_yaourt_commande || 0}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-semibold text-orange-700">{commande.total_jus_commande || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatutBadge statut={commande.statut as StatutCommande} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="Détails">
                        <Link href={`/commandes/${commande.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      {commande.statut === 'EN_ATTENTE' && (
                        <Button variant="ghost" size="icon" asChild title="Préparer" className="text-blue-600">
                          <Link href={`/commandes/${commande.id}/preparation`}>
                            <Package className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
