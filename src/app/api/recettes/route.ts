import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function isAuthorized(role: string | null | undefined): boolean {
  return !!role && ['ADMIN', 'GERANT'].includes(role)
}

async function getProfile() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null }
  const { data: profile } = await supabase
    .from('utilisateurs')
    .select('id, role, societe_id')
    .eq('id', user.id)
    .single()
  return { supabase, profile }
}

// =========================================
// GET : liste des recettes de la societe
// =========================================
export async function GET(req: NextRequest) {
  const { supabase, profile } = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const url = new URL(req.url)
  const recetteId = url.searchParams.get('id')

  // Cas 1 : detail d'une recette
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

    const { data: cout } = await supabase.rpc('fn_recette_cout', { p_recette_id: recetteId })

    return NextResponse.json({
      recette,
      matieres: matieres || [],
      charges: charges || [],
      cout: cout && cout[0] ? cout[0] : null,
    })
  }

  // Cas 2 : liste des recettes
  let query = supabase
    .from('recettes')
    .select('*, produit:produits(id, nom_produit, categorie)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (profile.role !== 'ADMIN') {
    query = query.eq('societe_id', profile.societe_id)
  }

  const { data: recettes, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrichir avec cout unitaire
  const enriched = await Promise.all(
    (recettes || []).map(async (r) => {
      const { data: cout } = await supabase.rpc('fn_recette_cout', { p_recette_id: r.id })
      return { ...r, cout: cout && cout[0] ? cout[0] : null }
    })
  )

  // Liste produits sans recette
  const societeId = profile.role === 'ADMIN'
    ? url.searchParams.get('societe_id') || profile.societe_id
    : profile.societe_id

  const { data: produitsSansRecette } = await supabase.rpc('fn_produits_sans_recette', {
    p_societe_id: societeId,
  })

  return NextResponse.json({
    recettes: enriched,
    produits_sans_recette: produitsSansRecette || [],
    role: profile.role,
  })
      }
// =========================================
// POST : creer une nouvelle recette
// Body: { produit_id, quantite_batch, notes, matieres: [], charges: [] }
// =========================================
export async function POST(req: NextRequest) {
  const { supabase, profile } = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  if (!isAuthorized(profile.role)) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
  }

  const body = await req.json()
  const { produit_id, quantite_batch, notes, matieres, charges } = body

  if (!produit_id || !quantite_batch || quantite_batch <= 0) {
    return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
  }

  // Trouver societe_id
  let societeId = profile.societe_id
  if (profile.role === 'ADMIN') {
    const { data: produit } = await supabase
      .from('produits')
      .select('societe_id')
      .eq('id', produit_id)
      .single()
    if (produit) societeId = produit.societe_id
  }

  // Verifier qu'il n'existe pas deja une recette pour ce produit
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

  // Creer la recette
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
    const matieresRows = matieres
      .filter((m: { matiere_id: string; quantite: number }) => m.matiere_id && m.quantite > 0)
      .map((m: { matiere_id: string; quantite: number; unite?: string }) => ({
        recette_id: recette.id,
        matiere_id: m.matiere_id,
        quantite: m.quantite,
        unite: m.unite || 'unite',
      }))

    if (matieresRows.length > 0) {
      const { error: errMatieres } = await supabase
        .from('recette_matieres')
        .insert(matieresRows)
      if (errMatieres) {
        return NextResponse.json({ error: errMatieres.message }, { status: 500 })
      }
    }
  }

  // Inserer charges
  if (Array.isArray(charges) && charges.length > 0) {
    const chargesRows = charges
      .filter((c: { categorie: string; montant_batch: number }) => c.categorie && c.montant_batch >= 0)
      .map((c: { categorie: string; montant_batch: number; notes?: string }) => ({
        recette_id: recette.id,
        categorie: c.categorie,
        montant_batch: c.montant_batch,
        notes: c.notes || null,
      }))

    if (chargesRows.length > 0) {
      const { error: errCharges } = await supabase
        .from('recette_charges')
        .insert(chargesRows)
      if (errCharges) {
        return NextResponse.json({ error: errCharges.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true, recette })
}

// =========================================
// PATCH : modifier une recette existante
// Body: { id, quantite_batch, notes, matieres, charges }
// =========================================
export async function PATCH(req: NextRequest) {
  const { supabase, profile } = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  if (!isAuthorized(profile.role)) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
  }

  const body = await req.json()
  const { id, quantite_batch, notes, matieres, charges } = body

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Update recette
  const updates: Record<string, unknown> = {}
  if (quantite_batch !== undefined) updates.quantite_batch = quantite_batch
  if (notes !== undefined) updates.notes = notes

  if (Object.keys(updates).length > 0) {
    const { error: errUpdate } = await supabase
      .from('recettes')
      .update(updates)
      .eq('id', id)
    if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 })
  }

  // Remplacer matieres (delete all + insert)
  if (Array.isArray(matieres)) {
    await supabase.from('recette_matieres').delete().eq('recette_id', id)
    const matieresRows = matieres
      .filter((m: { matiere_id: string; quantite: number }) => m.matiere_id && m.quantite > 0)
      .map((m: { matiere_id: string; quantite: number; unite?: string }) => ({
        recette_id: id,
        matiere_id: m.matiere_id,
        quantite: m.quantite,
        unite: m.unite || 'unite',
      }))
    if (matieresRows.length > 0) {
      const { error: errIns } = await supabase.from('recette_matieres').insert(matieresRows)
      if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 })
    }
  }

  // Remplacer charges (delete all + insert)
  if (Array.isArray(charges)) {
    await supabase.from('recette_charges').delete().eq('recette_id', id)
    const chargesRows = charges
      .filter((c: { categorie: string; montant_batch: number }) => c.categorie && c.montant_batch >= 0)
      .map((c: { categorie: string; montant_batch: number; notes?: string }) => ({
        recette_id: id,
        categorie: c.categorie,
        montant_batch: c.montant_batch,
        notes: c.notes || null,
      }))
    if (chargesRows.length > 0) {
      const { error: errIns } = await supabase.from('recette_charges').insert(chargesRows)
      if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
      }
// =========================================
// DELETE : soft delete (archive)
// =========================================
export async function DELETE(req: NextRequest) {
  const { supabase, profile } = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  if (!isAuthorized(profile.role)) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase
    .from('recettes')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
