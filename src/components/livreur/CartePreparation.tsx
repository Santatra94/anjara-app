'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TourneeDuJour } from '@/types/database.types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, MapPin, ArrowRight, Package, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export function CartePreparation({ task }: { task: TourneeDuJour }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.tache_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const statutLabel = task.statut_actuel === 'PREPARATION' ? 'En cours' : 'À faire';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden border-none shadow-md shadow-gray-200/50 rounded-2xl bg-white">
        <CardContent className="p-0">
          <div className="flex h-full min-h-[120px]">
            {/* Handle Drag */}
            <div
              {...attributes}
              {...listeners}
              className="w-10 bg-gray-50 flex items-center justify-center cursor-grab active:cursor-grabbing border-r border-gray-100"
            >
              <GripVertical className="h-5 w-5 text-gray-300" />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                   <Badge className="bg-purple-600 text-white border-none rounded-full text-[9px] px-2 font-black uppercase">
                     <Package className="h-2 w-2 mr-1 inline" /> Préparation
                   </Badge>
                   <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{task.reference}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight pt-1">{task.client_nom}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium italic">
                   <MapPin className="h-3 w-3 shrink-0 text-purple-400" />
                   <span className="truncate">{task.client_localisation || task.zone_nom}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase">
                   <ClipboardList className="h-3 w-3" />
                   {statutLabel}
                </div>

                <Button
                    asChild
                    className="h-10 rounded-full bg-purple-600 hover:bg-purple-700 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-100"
                >
                    <Link href={`/preparation/${task.tache_id}`}>
                       Préparer <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
