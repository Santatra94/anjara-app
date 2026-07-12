'use client';

import { useTournee } from "@/hooks/useTournee";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CarteLivraison } from "./CarteLivraison";
import { CarteRecouvrement } from "./CarteRecouvrement";
import { CartePreparation } from "./CartePreparation";
import { Clock, ListTodo, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function TourneeDuJour() {
  const { tasks, loading, updateTaskOrder, refresh } = useTournee();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.tache_id === active.id);
      const newIndex = tasks.findIndex((t) => t.tache_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
          updateTaskOrder(arrayMove(tasks, oldIndex, newIndex));
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <RefreshCcw className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Chargement de votre tournée...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Ma Tournée du jour</h2>
           <p className="text-lg font-bold">{format(new Date(), "EEEE d MMMM", { locale: fr })}</p>
        </div>
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-200">
            <ListTodo className="h-3.5 w-3.5" />
            {tasks.length} TÂCHES
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed flex flex-col items-center text-center gap-4 text-gray-400">
            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                <Clock className="h-8 w-8" />
            </div>
            <div>
                <p className="font-bold text-gray-900">Rien à l&apos;horizon !</p>
                <p className="text-sm">Vous n&apos;avez aucune livraison ni recouvrement prévu pour aujourd&apos;hui.</p>
            </div>
            <Button variant="outline" onClick={() => refresh()} className="mt-2 rounded-full font-bold">
                Actualiser
            </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={tasks.map(t => t.tache_id)}
            strategy={verticalListSortingStrategy}
          >
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
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="py-4 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fin de liste · Bonne route !</p>
      </div>
    </div>
  );
}
