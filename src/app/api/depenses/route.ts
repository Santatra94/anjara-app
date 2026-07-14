import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const categorie = searchParams.get('categorie')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur, error: utilisateurError } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (utilisateurError || !utilisateur) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    if (utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    let query = supabase
      .from('depenses')
      .select('*')
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .order('date_depense', { ascending: false })
      .order('created_at', { ascending: false })

    if (categorie && categorie !== 'TOUTES') {
      query = query.eq('categorie', categorie)
    }

    if (dateDebut) {
      query = query.gte('date_depense', dateDebut)
    }

    if (dateFin) {
      query = query.lte('date_depense', dateFin)
    }

    const { data, error } = await query

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur, error: utilisateurError } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (utilisateurError || !utilisateur) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    if (utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const { categorie, libelle, montant, date_depense, notes } = body

    if (!categorie || !libelle || !montant) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('depenses')
      .insert({
        societe_id: utilisateur.societe_id,
        categorie,
        libelle,
        montant: Number(montant),
        date_depense: date_depense || new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur, error: utilisateurError } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (utilisateurError || !utilisateur) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    if (utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const { id, categorie, libelle, montant, date_depense, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('depenses')
      .update({
        categorie,
        libelle,
        montant: Number(montant),
        date_depense,
        notes: notes || null,
      })
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur, error: utilisateurError } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (utilisateurError || !utilisateur) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    if (utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const { error } = await supabase
      .from('depenses')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}