import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

// =========================================
// GET : liste des productions OU detail par ?id=
// =========================================
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

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

    const productionId = searchParams.get('id')

    // Cas 1 : detail production
    if (productionId) {
      const { data: production, error } = await supabase
        .from('productions')
        .select('*, produit:produits(id, nom_produit, categorie)')
        .eq('id', productionId)
        .eq('is_archived', false)
        .single()

      if (error || !production) {
        return NextResponse.json({ error: 'Production non trouvee' }, { status: 404 })
      }

      const { data: matieres } = await supabase
        .from('production_matieres')
        .select('*, matiere:matieres_premieres(id, nom, unite)')
        .eq('production_id', productionId)

      return NextResponse.json({
        production,
        matieres: matieres || [],
        role: profil.role,
      })
    }

    // Cas 2 : liste productions
    let query = supabase
      .from('productions')
      .select('*, produit:produits(id, nom_produit, categorie)')
      .eq('is_archived', false)
      .order('date_production', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (profil.role !== 'ADMIN') {
      query = query.eq('societe_id', profil.societe_id)
    }

    const { data: productions, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      productions: productions || [],
      role: profil.role,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
// =========================================
// POST : creer une production (declenche triggers auto stock)
// Body: {
//   produit_id,
//   quantite_produite,
//   date_production,
//   notes,
//   recette_id (optionnel),
//   matieres: [{ matiere_id, quantite_consommee, unite }]
// }
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
      produit_id,
      quantite_produite,
      date_production,
      notes,
      recette_id,
      matieres,
    } = body

    if (!produit_id || !quantite_produite || Number(quantite_produite) <= 0) {
      return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
    }

    // Determiner societe_id
    let societeId = profil.societe_id
    if (profil.role === 'ADMIN') {
      const { data: produit } = await supabase
        .from('produits')
        .select('societe_id')
        .eq('id', produit_id)
        .single()
      if (produit) societeId = produit.societe_id
    }

    // Creer la production (le trigger cree ENTREE_PRODUCTION auto)
    const { data: production, error: errProd } = await supabase
      .from('productions')
      .insert({
        societe_id: societeId,
        produit_id,
        recette_id: recette_id || null,
        quantite_produite: Number(quantite_produite),
        date_production: date_production || new Date().toISOString().split('T')[0],
        notes: notes || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (errProd || !production) {
      return NextResponse.json({ error: errProd?.message || 'Erreur' }, { status: 500 })
    }

    // Inserer les matieres consommees (le trigger cree SORTIE_PRODUCTION auto)
    if (Array.isArray(matieres) && matieres.length > 0) {
      const rows = matieres
        .filter((m: { matiere_id: string; quantite_consommee: number }) =>
          m.matiere_id && Number(m.quantite_consommee) > 0
        )
        .map((m: { matiere_id: string; quantite_consommee: number; unite?: string }) => ({
          production_id: production.id,
          matiere_id: m.matiere_id,
          quantite_consommee: Number(m.quantite_consommee),
          unite: m.unite || 'unite',
        }))

      if (rows.length > 0) {
        const { error: errMat } = await supabase.from('production_matieres').insert(rows)
        if (errMat) {
          // Rollback : archiver la production
          await supabase.from('productions').update({ is_archived: true }).eq('id', production.id)
          return NextResponse.json({ error: errMat.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, production })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// =========================================
// DELETE : archiver production
// Seul ADMIN peut supprimer (annule aussi les mouvements associes via archive)
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

    // Archiver la production
    const { error: errProd } = await supabase
      .from('productions')
      .update({ is_archived: true })
      .eq('id', id)

    if (errProd) return NextResponse.json({ error: errProd.message }, { status: 500 })

    // Archiver les mouvements de stock lies
    await supabase
      .from('mouvements_stock')
      .update({ is_archived: true })
      .eq('reference_type', 'PRODUCTION')
      .eq('reference_id', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
