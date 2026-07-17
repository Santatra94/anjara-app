import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

const getDateRange = (t: string, aujourd_hui: Date, searchParams: URLSearchParams) => {
  if (t === 'aujourd_hui') {
    const d = format(aujourd_hui, 'yyyy-MM-dd')
    return { debut: d, fin: d }
  }
  if (t === 'mois_precedent') {
    const mp = subMonths(aujourd_hui, 1)
    return { debut: format(startOfMonth(mp), 'yyyy-MM-dd'), fin: format(endOfMonth(mp), 'yyyy-MM-dd') }
  }
  if (t === 'personnalise') {
    return {
      debut: searchParams.get('debut') || format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
      fin: searchParams.get('fin') || format(aujourd_hui, 'yyyy-MM-dd'),
    }
  }
  return { debut: format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'), fin: format(endOfMonth(aujourd_hui), 'yyyy-MM-dd') }
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { data: profil } = await supabase.from('utilisateurs').select('societe_id, role').eq('id', user.id).single()
    if (!profil || !isAuthorized(profil.role)) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })

    const societe_id = profil.societe_id
    const type = searchParams.get('type') || 'ce_mois'
    const aujourd_hui = new Date()
    const { debut, fin } = getDateRange(type, aujourd_hui, searchParams)

    // Appel de la fonction SQL optimisee (utilise recettes + prix_achat en fallback)
    const { data, error } = await supabase.rpc('fn_finance_summary', {
      p_societe_id: societe_id,
      p_debut: debut,
      p_fin: fin,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Aucune donnee' }, { status: 500 })
    }

    return NextResponse.json({
      ...data,
      periode: { debut, fin, type },
      role: profil.role,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { data: profil } = await supabase.from('utilisateurs').select('societe_id, role').eq('id', user.id).single()
    if (!profil || !isAuthorized(profil.role)) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })

    const { type_mouvement, montant, libelle, date_mouvement, notes } = body

    if (!type_mouvement || !montant || !libelle) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }
    if (!['INJECTION', 'RETRAIT'].includes(type_mouvement)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const { data, error } = await supabase.from('mouvements_caisse').insert({
      societe_id: profil.societe_id,
      type_mouvement,
      montant: Number(montant),
      libelle,
      date_mouvement: date_mouvement || new Date().toISOString().split('T')[0],
      notes: notes || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
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
    if (authError || !user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { data: profil } = await supabase.from('utilisateurs').select('societe_id, role').eq('id', user.id).single()
    if (!profil || !isAuthorized(profil.role)) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })

    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const { data: existing } = await supabase
      .from('mouvements_caisse')
      .select('date_mouvement')
      .eq('id', id)
      .eq('societe_id', profil.societe_id)
      .eq('is_archived', false)
      .single()

    if (!existing) return NextResponse.json({ error: 'Mouvement introuvable' }, { status: 404 })

    if (profil.role === 'GERANT' && !isToday(existing.date_mouvement)) {
      return NextResponse.json({ error: 'Suppression impossible : seul le jour meme est autorise' }, { status: 403 })
    }

    const { error } = await supabase
      .from('mouvements_caisse')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('societe_id', profil.societe_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}