import { CommandeForm } from '@/components/commandes/CommandeForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NouvelleCommandeLivreurPage() {
  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/tournee"
          className="rounded-full p-2 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Nouvelle commande</h1>
      </div>
      <CommandeForm />
    </div>
  );
}
