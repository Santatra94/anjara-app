'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { livreurSchema } from '@/lib/schemas';

type LivreurValues = z.infer<typeof livreurSchema>;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anjara-app.vercel.app';
const redirectDefinirMdp = appUrl + '/definir-mot-de-passe';

async function checkAdminAuth() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifie");
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

    if (callerProfile.societe_id !== societeId) {
      throw new Error("Incoherence de societe");
    }

    if (!values.email) {
      throw new Error("Email obligatoire pour envoyer l'invitation");
    }

    const { data: existing } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', values.email)
      .maybeSingle();

    if (existing) {
      throw new Error("Cet email est deja utilise");
    }

    const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(values.email, {
      redirectTo: redirectDefinirMdp,
    });

    if (inviteError || !invitation.user) {
      throw new Error("Erreur invitation : " + (inviteError?.message || "inconnu"));
    }

    const { error: profileError } = await supabaseAdmin
      .from('utilisateurs')
      .insert([{
        id: invitation.user.id,
        societe_id: societeId,
        nom: values.nom,
        email: values.email,
        telephone: values.telephone || null,
        role: 'LIVREUR',
        zone_id: values.zone_id || null,
        actif: values.actif ?? true
      }]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(invitation.user.id);
      throw profileError;
    }

    revalidatePath('/livreurs');
    return { success: true, message: "Invitation envoyee a " + values.email };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    return { success: false, error: message };
  }
}

export async function updateLivreurAction(id: string, values: LivreurValues) {
  try {
    const callerProfile = await checkAdminAuth();

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('utilisateurs')
      .select('societe_id')
      .eq('id', id)
      .single();

    if (targetError || !targetProfile || targetProfile.societe_id !== callerProfile.societe_id) {
      throw new Error("Utilisateur introuvable ou acces refuse");
    }

    const { error } = await supabaseAdmin
      .from('utilisateurs')
      .update({
        nom: values.nom,
        email: values.email,
        telephone: values.telephone || null,
        zone_id: values.zone_id || null,
        actif: values.actif
      })
      .eq('id', id);

    if (error) throw error;

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

export async function resetPasswordLivreurAction(livreurId: string) {
  try {
    const callerProfile = await checkAdminAuth();

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('utilisateurs')
      .select('societe_id, email')
      .eq('id', livreurId)
      .single();

    if (targetError || !targetProfile || targetProfile.societe_id !== callerProfile.societe_id) {
      throw new Error("Utilisateur introuvable ou acces refuse");
    }

    if (!targetProfile.email) {
      throw new Error("Cet utilisateur n'a pas d'email enregistre");
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetProfile.email, {
      redirectTo: redirectDefinirMdp,
    });

    if (resetError) {
      throw new Error("Erreur envoi email : " + resetError.message);
    }

    return { success: true, message: "Email de reinitialisation envoye a " + targetProfile.email };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    return { success: false, error: message };
  }
}