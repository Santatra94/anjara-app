'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-12 md:h-16 flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-1.5 md:gap-2">
          <span className="text-xl md:text-2xl">🥛</span>
          <span className="font-bold text-base md:text-xl text-gray-900">Anjara</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {loading ? (
          <div className="text-sm text-gray-500">...</div>
        ) : user ? (
          <>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user.utilisateur.nom}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {user.utilisateur.role} · {user.societe.nom}
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition"
            >
              Deconnexion
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}