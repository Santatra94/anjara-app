import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function canEdit(role: string, dateDepense: string): boolean {
  if (role === 'ADMIN') return true
  return isToday(dateDepense)
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    let query = supabase
      .from('depenses')
      .select('*, matieres_premieres(nom, unite)')
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

    return NextResponse.json({ data: data || [], role: utilisateur.role })
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

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const { categorie, libelle, montant, date_depense, notes, quantite, prix_unitaire, matiere_id } = body

    if (!categorie || !montant) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    if (categorie === 'MATIERES_PREMIERES' && !matiere_id) {
      return NextResponse.json({ error: 'Matiere premiere requise' }, { status: 400 })
    }

    if (categorie !== 'MATIERES_PREMIERES' && !libelle) {
      return NextResponse.json({ error: 'Libelle requis' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      societe_id: utilisateur.societe_id,
      categorie,
      libelle: libelle || null,
      montant: Number(montant),
      date_depense: date_depense || new Date().toISOString().split('T')[0],
      notes: notes || null,
      quantite: quantite ? Number(quantite) : null,
      prix_unitaire: prix_unitaire ? Number(prix_unitaire) : null,
      matiere_id: matiere_id || null,
    }

    const { data, error } = await supabase
      .from('depenses')
      .insert(insertData)
      .select('*, matieres_premieres(nom, unite)')
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const { id, categorie, libelle, montant, date_depense, notes, quantite, prix_unitaire, matiere_id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('depenses')
      .select('date_depense')
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Depense introuvable' }, { status: 404 })
    }

    if (!canEdit(utilisateur.role, existing.date_depense)) {
      return NextResponse.json({ error: 'Modification impossible : seul le jour meme est autorise' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {
      categorie,
      libelle: libelle || null,
      montant: Number(montant),
      date_depense,
      notes: notes || null,
      quantite: quantite ? Number(quantite) : null,
      prix_unitaire: prix_unitaire ? Number(prix_unitaire) : null,
      matiere_id: matiere_id || null,
    }

    const { data, error } = await supabase
      .from('depenses')
      .update(updateData)
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .select('*, matieres_premieres(nom, unite)')
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || utilisateur.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('depenses')
      .select('date_depense')
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Depense introuvable' }, { status: 404 })
    }

    if (!canEdit(utilisateur.role, existing.date_depense)) {
      return NextResponse.json({ error: 'Suppression impossible : seul le jour meme est autorise' }, { status: 403 })
    }

    const { error } = await supabase
      .from('depenses')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('societe_id', utilisateur.societe_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}