'use client';

import { Badge } from "@/components/ui/badge";
import { StatutCommande } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface StatutBadgeProps {
  statut: StatutCommande;
  className?: string;
}

export function StatutBadge({ statut, className }: StatutBadgeProps) {
  const configs: Record<StatutCommande, { label: string, color: string }> = {
    'EN_ATTENTE': { label: 'En attente', color: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
    'PREPARATION': { label: 'Préparation', color: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    'EN_LIVRAISON': { label: 'En livraison', color: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
    'LIVRE_PAYE': { label: 'Livré (Payé)', color: 'bg-green-100 text-green-700 hover:bg-green-100' },
    'LIVRE_DETTE': { label: 'Livré (Dette)', color: 'bg-red-100 text-red-700 hover:bg-red-100' },
    'ANNULE': { label: 'Annulé', color: 'bg-gray-100 text-gray-400 line-through hover:bg-gray-100' },
  };

  const config = configs[statut];

  return (
    <Badge className={cn("border-none", config.color, className)}>
      {config.label}
    </Badge>
  );
}
