import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profil } = await supabase
    .from('utilisateurs')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profil?.role === 'LIVREUR') {
    redirect('/dashboard');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
