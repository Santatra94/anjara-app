import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const categorie = searchParams.get('categorie')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || !['ADMIN', 'GERANT'].includes(utilisateur.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    let query = supabase
      .from('depenses')
      .select('*')
      .eq('societe_id', utilisateur.societe_id)
      .eq('is_archived', false)
      .order('date_depense', { ascending: false })

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

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || !['ADMIN', 'GERANT'].includes(utilisateur.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || !['ADMIN', 'GERANT'].includes(utilisateur.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (!utilisateur || !['ADMIN', 'GERANT'].includes(utilisateur.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
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
