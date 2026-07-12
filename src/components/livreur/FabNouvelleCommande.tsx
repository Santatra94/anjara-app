'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

export function FabNouvelleCommande() {
  const pathname = usePathname();

  // Ne pas afficher le FAB sur la page nouvelle-commande elle-même
  if (pathname === '/nouvelle-commande') return null;

  return (
    <Link
      href="/nouvelle-commande"
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-xl shadow-blue-300 flex items-center justify-center transition-all"
      aria-label="Nouvelle commande"
    >
      <Plus className="h-7 w-7 text-white stroke-[3px]" />
    </Link>
  );
}
