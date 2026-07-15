import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profil || profil.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Reserve ADMIN' }, { status: 403 })
    }

    // Recuperer tous les GERANTS avec leur societe
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('id, nom, email, telephone, actif, created_at, societe_id, societes(nom)')
      .eq('role', 'GERANT')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profil || profil.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Reserve ADMIN' }, { status: 403 })
    }

    const { nom_societe, nom_gerant, email, telephone } = body

    if (!nom_societe || !nom_gerant || !email) {
      return NextResponse.json({ error: 'Champs manquants (nom societe, nom gerant, email)' }, { status: 400 })
    }

    // Verifier que l'email n'existe pas deja
    const { data: existing } = await supabase
      .from('utilisateurs')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Cet email existe deja' }, { status: 400 })
    }

    // Inviter l'utilisateur via Supabase Admin (envoi email automatique)
    const admin = getAdminClient()
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)

    if (inviteError || !invitation.user) {
      return NextResponse.json({ error: 'Erreur invitation : ' + (inviteError?.message || 'inconnu') }, { status: 500 })
    }

    // Creer la societe + le profil GERANT (via fonction SQL atomique)
    const { data: societeData, error: fnError } = await admin.rpc('fn_create_societe_avec_gerant', {
      p_nom_societe: nom_societe,
      p_user_id: invitation.user.id,
      p_nom_gerant: nom_gerant,
      p_email: email,
      p_telephone: telephone || null,
    })

    if (fnError) {
      // Rollback : supprimer l'user auth cree
      await admin.auth.admin.deleteUser(invitation.user.id)
      return NextResponse.json({ error: 'Erreur creation : ' + fnError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: invitation.user.id,
      societe_id: societeData,
      message: 'Invitation envoyee a ' + email,
    }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profil || profil.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Reserve ADMIN' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Soft delete
    const { error } = await supabase
      .from('utilisateurs')
      .update({ is_archived: true, actif: false })
      .eq('id', id)
      .eq('role', 'GERANT')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
                               }
