'use client';

import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from './BottomNav';
import { IndicateurReseau } from './IndicateurReseau';
import { FabNouvelleCommande } from './FabNouvelleCommande';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LogOut } from 'lucide-react';

export function LivreurShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['LIVREUR']}>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
        {/* Header mobile optimisé */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
             <span className="text-xl">🥛</span>
             <span className="font-extrabold text-lg tracking-tight">ANJARA</span>
             <IndicateurReseau />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 max-w-[100px] truncate">
              {user?.utilisateur.nom.split(' ')[0]}
            </span>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
           {children}
        </main>

        <FabNouvelleCommande />
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
