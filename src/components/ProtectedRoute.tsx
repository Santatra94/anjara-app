'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RoleUtilisateur } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleUtilisateur[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    if (!loading && user && allowedRoles && !allowedRoles.includes(user.utilisateur.role)) {
      router.push('/');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.utilisateur.role)) {
    return null;
  }

  return <>{children}</>;
}
