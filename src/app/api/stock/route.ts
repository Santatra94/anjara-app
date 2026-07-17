import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

// =========================================
// GET : stock actuel + alertes + mouvements recents
// =========================================
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

    if (!profil) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })

    const { data, error } = await supabase.rpc('fn_stock_summary', {
      p_societe_id: profil.societe_id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ...data,
      role: profil.role,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
// =========================================
// POST : creer un mouvement stock manuel
// Body: { type_mouvement, ressource_type, ressource_id, quantite, unite, prix_unitaire, notes, date_mouvement }
// Types autorises manuellement : ENTREE_ACHAT, PERTE, AJUSTEMENT, RETOUR_VENTE
// =========================================
export async function POST(request: Request) {
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

    if (!profil || !isAuthorized(profil.role)) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type_mouvement,
      ressource_type,
      ressource_id,
      quantite,
      unite,
      prix_unitaire,
      notes,
      date_mouvement,
    } = body

    // Validations
    const typesAutorises = ['ENTREE_ACHAT', 'PERTE', 'AJUSTEMENT', 'RETOUR_VENTE']
    if (!type_mouvement || !typesAutorises.includes(type_mouvement)) {
      return NextResponse.json({ error: 'Type de mouvement invalide' }, { status: 400 })
    }
    if (!ressource_type || !['MATIERE', 'PRODUIT'].includes(ressource_type)) {
      return NextResponse.json({ error: 'Type de ressource invalide' }, { status: 400 })
    }
    if (!ressource_id || !quantite) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Determiner societe_id (ADMIN peut agir sur n'importe quelle societe via la ressource)
    let societeId = profil.societe_id
    if (profil.role === 'ADMIN') {
      const table = ressource_type === 'MATIERE' ? 'matieres_premieres' : 'produits'
      const { data: ressource } = await supabase
        .from(table)
        .select('societe_id')
        .eq('id', ressource_id)
        .single()
      if (ressource) societeId = ressource.societe_id
    }

    // Determiner le signe de la quantite selon type
    // ENTREE_ACHAT, RETOUR_VENTE : positif
    // PERTE : negatif
    // AJUSTEMENT : peut etre positif ou negatif (on garde le signe fourni)
    let quantiteFinale = Math.abs(Number(quantite))
    if (type_mouvement === 'PERTE') {
      quantiteFinale = -quantiteFinale
    } else if (type_mouvement === 'AJUSTEMENT') {
      quantiteFinale = Number(quantite) // Garder le signe original
    }

    const { data, error } = await supabase
      .from('mouvements_stock')
      .insert({
        societe_id: societeId,
        type_mouvement,
        ressource_type,
        ressource_id,
        quantite: quantiteFinale,
        unite: unite || 'unite',
        prix_unitaire: prix_unitaire || null,
        notes: notes || null,
        date_mouvement: date_mouvement || new Date().toISOString().split('T')[0],
        user_id: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, mouvement: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// =========================================
// PATCH : inventaire initial (AJUSTEMENT en batch)
// Body: { items: [{ ressource_type, ressource_id, quantite, unite }] }
// =========================================
export async function PATCH(request: Request) {
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

    if (!profil || !isAuthorized(profil.role)) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Aucun item fourni' }, { status: 400 })
    }

    // Recuperer stock actuel pour calculer l'ajustement necessaire
    const { data: stockActuel } = await supabase.rpc('fn_stock_actuel', {
      p_societe_id: profil.societe_id,
    })

    const stockMap = new Map<string, number>()
    if (stockActuel) {
      for (const s of stockActuel) {
        stockMap.set(s.ressource_type + '_' + s.ressource_id, Number(s.quantite_totale))
      }
    }

    // Preparer les mouvements d'ajustement
    const mouvementsToInsert = items
      .filter((item: { ressource_type: string; ressource_id: string; quantite: number }) =>
        item.ressource_type && item.ressource_id && item.quantite !== undefined
      )
      .map((item: { ressource_type: string; ressource_id: string; quantite: number; unite?: string }) => {
        const key = item.ressource_type + '_' + item.ressource_id
        const actuel = stockMap.get(key) || 0
        const cible = Number(item.quantite)
        const delta = cible - actuel
        return {
          societe_id: profil.societe_id,
          type_mouvement: 'AJUSTEMENT',
          ressource_type: item.ressource_type,
          ressource_id: item.ressource_id,
          quantite: delta,
          unite: item.unite || 'unite',
          notes: 'Inventaire initial',
          date_mouvement: new Date().toISOString().split('T')[0],
          user_id: user.id,
        }
      })
      .filter((m: { quantite: number }) => m.quantite !== 0)

    if (mouvementsToInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucun ajustement necessaire', count: 0 })
    }

    const { error } = await supabase
      .from('mouvements_stock')
      .insert(mouvementsToInsert)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, count: mouvementsToInsert.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// =========================================
// DELETE : archiver un mouvement (correction erreur)
// Seul ADMIN peut supprimer un mouvement
// =========================================
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

    if (!profil || profil.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Seul ADMIN peut supprimer' }, { status: 403 })
    }

    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const { error } = await supabase
      .from('mouvements_stock')
      .update({ is_archived: true })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
