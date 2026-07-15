import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()
    if (!profil || profil.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('matieres_premieres')
      .select('*')
      .eq('societe_id', profil.societe_id)
      .eq('is_archived', false)
      .order('nom', { ascending: true })
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
      .select('societe_id, role')
      .eq('id', user.id)
      .single()
    if (!profil || profil.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }
    const { nom, unite } = body
    if (!nom || !unite) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('matieres_premieres')
      .insert({
        societe_id: profil.societe_id,
        nom,
        unite,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()
    if (!profil || profil.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }
    const { id, nom, unite } = body
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('matieres_premieres')
      .update({ nom, unite })
      .eq('id', id)
      .eq('societe_id', profil.societe_id)
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()
    if (!profil || profil.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }
    const { error } = await supabase
      .from('matieres_premieres')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('societe_id', profil.societe_id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
        }
