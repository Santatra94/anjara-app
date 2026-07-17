import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

// =========================================
// GET : liste recettes OU detail par ?id=
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

    const recetteId = searchParams.get('id')

    // Cas 1 : detail
    if (recetteId) {
      const { data: recette, error } = await supabase
        .from('recettes')
        .select('*, produit:produits(id, nom_produit, categorie, prix, prix_achat)')
        .eq('id', recetteId)
        .eq('is_archived', false)
        .single()

      if (error || !recette) {
        return NextResponse.json({ error: 'Recette non trouvee' }, { status: 404 })
      }

      const { data: matieres } = await supabase
        .from('recette_matieres')
        .select('*, matiere:matieres_premieres(id, nom, unite)')
        .eq('recette_id', recetteId)

      const { data: charges } = await supabase
        .from('recette_charges')
        .select('*')
        .eq('recette_id', recetteId)

      const { data: cout } = await supabase.rpc('fn_recette_cout', {
        p_recette_id: recetteId,
      })

      return NextResponse.json({
        recette,
        matieres: matieres || [],
        charges: charges || [],
        cout: cout && cout[0] ? cout[0] : null,
        role: profil.role,
      })
    }

    // Cas 2 : liste
    let query = supabase
      .from('recettes')
      .select('*, produit:produits(id, nom_produit, categorie)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (profil.role !== 'ADMIN') {
      query = query.eq('societe_id', profil.societe_id)
    }

    const { data: recettes, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrichir avec cout
    const enriched = await Promise.all(
      (recettes || []).map(async (r) => {
        const { data: cout } = await supabase.rpc('fn_recette_cout', {
          p_recette_id: r.id,
        })
        return { ...r, cout: cout && cout[0] ? cout[0] : null }
      })
    )

    // Liste produits sans recette (pour badges alerte)
    const societeId = profil.role === 'ADMIN'
      ? (searchParams.get('societe_id') || profil.societe_id)
      : profil.societe_id

    let produitsSansRecette: unknown[] = []
    if (societeId) {
      const { data } = await supabase.rpc('fn_produits_sans_recette', {
        p_societe_id: societeId,
      })
      produitsSansRecette = data || []
    }

    return NextResponse.json({
      recettes: enriched,
      produits_sans_recette: produitsSansRecette,
      role: profil.role,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
// =========================================
// POST : creer une recette
// Body: { produit_id, quantite_batch, notes, matieres, charges }
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
    const { produit_id, quantite_batch, notes, matieres, charges } = body

    if (!produit_id || !quantite_batch || quantite_batch <= 0) {
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

    // Verifier unicite recette / produit
    const { data: existing } = await supabase
      .from('recettes')
      .select('id')
      .eq('produit_id', produit_id)
      .eq('is_archived', false)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Une recette existe deja pour ce produit' },
        { status: 400 }
      )
    }

    // Creer recette
    const { data: recette, error: errRecette } = await supabase
      .from('recettes')
      .insert({
        societe_id: societeId,
        produit_id,
        quantite_batch,
        notes: notes || null,
      })
      .select()
      .single()

    if (errRecette || !recette) {
      return NextResponse.json({ error: errRecette?.message || 'Erreur' }, { status: 500 })
    }

    // Inserer matieres
    if (Array.isArray(matieres) && matieres.length > 0) {
      const rows = matieres
        .filter((m: { matiere_id: string; quantite: number }) => m.matiere_id && m.quantite > 0)
        .map((m: { matiere_id: string; quantite: number; unite?: string }) => ({
          recette_id: recette.id,
          matiere_id: m.matiere_id,
          quantite: m.quantite,
          unite: m.unite || 'unite',
        }))
      if (rows.length > 0) {
        const { error } = await supabase.from('recette_matieres').insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Inserer charges
    if (Array.isArray(charges) && charges.length > 0) {
      const rows = charges
        .filter((c: { categorie: string; montant_batch: number }) =>
          c.categorie && c.montant_batch >= 0
        )
        .map((c: { categorie: string; montant_batch: number; notes?: string }) => ({
          recette_id: recette.id,
          categorie: c.categorie,
          montant_batch: c.montant_batch,
          notes: c.notes || null,
        }))
      if (rows.length > 0) {
        const { error } = await supabase.from('recette_charges').insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, recette })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// =========================================
// PATCH : modifier une recette
// Body: { id, quantite_batch, notes, matieres, charges }
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
    const { id, quantite_batch, notes, matieres, charges } = body

    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (quantite_batch !== undefined) updates.quantite_batch = quantite_batch
    if (notes !== undefined) updates.notes = notes

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('recettes').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remplacer matieres
    if (Array.isArray(matieres)) {
      await supabase.from('recette_matieres').delete().eq('recette_id', id)
      const rows = matieres
        .filter((m: { matiere_id: string; quantite: number }) => m.matiere_id && m.quantite > 0)
        .map((m: { matiere_id: string; quantite: number; unite?: string }) => ({
          recette_id: id,
          matiere_id: m.matiere_id,
          quantite: m.quantite,
          unite: m.unite || 'unite',
        }))
      if (rows.length > 0) {
        const { error } = await supabase.from('recette_matieres').insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Remplacer charges
    if (Array.isArray(charges)) {
      await supabase.from('recette_charges').delete().eq('recette_id', id)
      const rows = charges
        .filter((c: { categorie: string; montant_batch: number }) =>
          c.categorie && c.montant_batch >= 0
        )
        .map((c: { categorie: string; montant_batch: number; notes?: string }) => ({
          recette_id: id,
          categorie: c.categorie,
          montant_batch: c.montant_batch,
          notes: c.notes || null,
        }))
      if (rows.length > 0) {
        const { error } = await supabase.from('recette_charges').insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
// =========================================
// DELETE : soft delete recette
// =========================================
export async function DELETE(request: Request) {
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

    if (!profil || !isAuthorized(profil.role)) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const { error } = await supabase
      .from('recettes')
      .update({ is_archived: true })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}