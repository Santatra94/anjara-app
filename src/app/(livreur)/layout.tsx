import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LivreurShell } from '@/components/livreur/LivreurShell';

export default async function LivreurGroupLayout({
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

  if (profil?.role !== 'LIVREUR') {
    redirect('/');
  }

  return <LivreurShell>{children}</LivreurShell>;
}
