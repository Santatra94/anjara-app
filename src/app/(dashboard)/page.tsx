'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement de votre session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Redirection vers la connexion...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Bienvenue, {user.utilisateur.nom} 👋
      </h1>
      <p className="text-gray-600 mb-8">
        Vous êtes connecté en tant que <strong>{user.utilisateur.role}</strong> chez <strong>{user.societe.nom}</strong>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Commandes du jour</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">—</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Encaissé aujourd&apos;hui</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">—</div>
        </div>
      </div>
    </div>
  );
}