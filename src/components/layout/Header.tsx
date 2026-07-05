'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Nom */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🥛</span>
              <span className="font-bold text-xl text-gray-900">Anjara</span>
            </Link>

            {/* Navigation */}
            {user && (
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Tableau de bord
                </Link>
                <Link
                  href="/commandes"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Commandes
                </Link>
                <Link
                  href="/clients"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clients
                </Link>
                <Link
                  href="/stock"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Stock
                </Link>
              </nav>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-sm text-gray-500">Chargement...</div>
            ) : user ? (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.utilisateur.nom}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.utilisateur.role} · {user.societe.nom}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition"
                >
                  Déconnexion
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
