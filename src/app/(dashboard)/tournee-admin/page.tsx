'use client';

import { useState } from 'react';
import { useTourneeAdmin } from '@/hooks/useTourneeAdmin';
import { CarteLivraison } from '@/components/livreur/CarteLivraison';
import { CarteRecouvrement } from '@/components/livreur/CarteRecouvrement';
import { CartePreparation } from '@/components/livreur/CartePreparation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, ListTodo, RefreshCcw, Truck } from 'lucide-react';

export default function TourneeAdminPage() {
  const [livreurIdSelectionne, setLivreurIdSelectionne] = useState<string | null>(null);

  const { tasks, loading, livreurs, loadingLivreurs, refresh } = useTourneeAdmin(livreurIdSelectionne);

  const livreurActuel = livreurs.find((l) => l.id === livreurIdSelectionne);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">
            Tournee du jour
          </h2>
          <p className="text-lg font-bold">
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </p>
        </div>
        {livreurIdSelectionne && (
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-200">
            <ListTodo className="h-3.5 w-3.5" />
            {tasks.length} TACHES
          </div>
        )}
      </div>

      {/* Dropdown livreur */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-2">
          <Truck className="h-4 w-4" />
          Choisir un livreur
        </div>
        <Select
          onValueChange={(val) => setLivreurIdSelectionne(val)}
          value={livreurIdSelectionne || undefined}
          disabled={loadingLivreurs}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingLivreurs ? "Chargement..." : "Selectionner un livreur"} />
          </SelectTrigger>
          <SelectContent>
            {livreurs.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                <div className="flex items-center gap-2">
                  <span>{l.nom}</span>
                  <span className="text-xs text-gray-400 uppercase">({l.role})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contenu */}
      {!livreurIdSelectionne ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed flex flex-col items-center text-center gap-4 text-gray-400">
          <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Selectionnez un livreur</p>
            <p className="text-sm">Choisissez un livreur pour voir sa tournee du jour.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <RefreshCcw className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">
            Chargement de la tournee de {livreurActuel?.nom}...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed flex flex-col items-center text-center gap-4 text-gray-400">
          <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Rien a l&apos;horizon !</p>
            <p className="text-sm">
              {livreurActuel?.nom} n&apos;a aucune livraison ni recouvrement prevu aujourd&apos;hui.
            </p>
          </div>
          <Button variant="outline" onClick={() => refresh()} className="mt-2 rounded-full font-bold">
            Actualiser
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            if (task.type_tache === 'PREPARATION') {
              return <CartePreparation key={task.tache_id} task={task} />;
            }
            if (task.type_tache === 'LIVRAISON') {
              return <CarteLivraison key={task.tache_id} task={task} />;
            }
            if (task.type_tache === 'RECOUVREMENT') {
              return <CarteRecouvrement key={task.tache_id} task={task} />;
            }
            return null;
          })}
          <div className="py-4 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Fin de liste
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
