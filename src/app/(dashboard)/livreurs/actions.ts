'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { livreurSchema } from '@/lib/schemas';

type LivreurValues = z.infer<typeof livreurSchema>;

async function checkAdminAuth() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  const { data: profile, error: profileError } = await supabase
    .from('utilisateurs')
    .select('role, societe_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profil utilisateur introuvable");
  }

  if (profile.role !== 'ADMIN' && profile.role !== 'GERANT') {
    throw new Error("Permissions insuffisantes");
  }

  return profile;
}

export async function createLivreurAction(values: LivreurValues, societeId: string) {
  try {
    const callerProfile = await checkAdminAuth();

    // Protection contre l'injection de societeId
    if (callerProfile.societe_id !== societeId) {
       throw new Error("Incohérence de société");
    }

    // 1. Créer l'utilisateur dans Supabase Auth via Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: values.email || `${values.nom.toLowerCase().replace(/\s/g, '.')}@anjara.mg`,
      password: values.password || 'anjara123',
      email_confirm: true,
      user_metadata: { role: 'LIVREUR', societe_id: societeId }
    });

    if (authError) throw authError;

    // 2. Créer l'entrée dans la table utilisateurs (profil)
    const { error: profileError } = await supabaseAdmin
      .from('utilisateurs')
      .insert([{
        id: authUser.user.id,
        societe_id: societeId,
        nom: values.nom,
        email: values.email || null,
        telephone: values.telephone || null,
        role: 'LIVREUR',
        zone_id: values.zone_id || null,
        actif: values.actif ?? true
      }]);

    if (profileError) throw profileError;

    revalidatePath('/livreurs');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    return { success: false, error: message };
  }
}

export async function updateLivreurAction(id: string, values: LivreurValues) {
  try {
    const callerProfile = await checkAdminAuth();

    // Vérifier que le livreur à modifier appartient à la même société
    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('utilisateurs')
        .select('societe_id')
        .eq('id', id)
        .single();

    if (targetError || !targetProfile || targetProfile.societe_id !== callerProfile.societe_id) {
        throw new Error("Utilisateur introuvable ou accès refusé");
    }

    const { error } = await supabaseAdmin
      .from('utilisateurs')
      .update({
        nom: values.nom,
        email: values.email || null,
        telephone: values.telephone || null,
        zone_id: values.zone_id || null,
        actif: values.actif
      })
      .eq('id', id);

    if (error) throw error;

    // Optionnel: Mettre à jour l'email dans Auth si changé
    if (values.email) {
        await supabaseAdmin.auth.admin.updateUserById(id, { email: values.email });
    }

    revalidatePath('/livreurs');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    return { success: false, error: message };
  }
}
