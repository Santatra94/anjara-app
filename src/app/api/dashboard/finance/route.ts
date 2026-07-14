import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: profil, error: profilError } = await supabase
      .from('utilisateurs')
      .select('societe_id, role')
      .eq('id', user.id)
      .single()

    if (profilError || !profil) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    if (profil.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const societe_id = profil.societe_id
    const type = searchParams.get('type') || 'ce_mois'
    const aujourd_hui = new Date()

    function getDateRange(t: string) {
      if (t === 'aujourd_hui') {
        const d = format(aujourd_hui, 'yyyy-MM-dd')
        return { debut: d, fin: d }
      }
      if (t === 'mois_precedent') {
        const mp = subMonths(aujourd_hui, 1)
        return {
          debut: format(startOfMonth(mp), 'yyyy-MM-dd'),
          fin: format(endOfMonth(mp), 'yyyy-MM-dd'),
        }
      }
      if (t === 'personnalise') {
        return {
          debut: searchParams.get('debut') || format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
          fin: searchParams.get('fin') || format(aujourd_hui, 'yyyy-MM-dd'),
        }
      }
      return {
        debut: format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
        fin: format(endOfMonth(aujourd_hui), 'yyyy-MM-dd'),
      }
    }

    const { debut, fin } = getDateRange(type)
    const debutIso = debut + 'T00:00:00'
    const finIso = fin + 'T23:59:59'

    // -- CA periode (encaissements)
    const { data: encaissements } = await supabase
      .from('encaissements')
      .select('montant_encaisse, date_encaissement')
      .eq('societe_id', societe_id)
      .gte('date_encaissement', debutIso)
      .lte('date_encaissement', finIso)

    let ca_periode = 0
    if (encaissements) {
      for (const e of encaissements) {
        ca_periode += Number(e.montant_encaisse || 0)
      }
    }

    // -- Depenses periode
    const { data: depenses } = await supabase
      .from('depenses')
      .select('montant, categorie, date_depense, libelle')
      .eq('societe_id', societe_id)
      .eq('is_archived', false)
      .gte('date_depense', debut)
      .lte('date_depense', fin)

    let total_depenses = 0
    const depenses_par_categorie: Record<string, number> = {}

    if (depenses) {
      for (const d of depenses) {
        const montant = Number(d.montant || 0)
        total_depenses += montant
        depenses_par_categorie[d.categorie] =
          (depenses_par_categorie[d.categorie] || 0) + montant
      }
    }

    const benefice = ca_periode - total_depenses

    // -- Graphique 6 derniers mois (CA vs Depenses)
    const graphique_mois = []
    for (let i = 5; i >= 0; i--) {
      const mois = subMonths(aujourd_hui, i)
      const debutMois = format(startOfMonth(mois), 'yyyy-MM-dd')
      const finMois = format(endOfMonth(mois), 'yyyy-MM-dd')
      const debutMoisIso = debutMois + 'T00:00:00'
      const finMoisIso = finMois + 'T23:59:59'
      const labelMois = format(mois, 'MMM yyyy')

      const { data: encMois } = await supabase
        .from('encaissements')
        .select('montant_encaisse')
        .eq('societe_id', societe_id)
        .gte('date_encaissement', debutMoisIso)
        .lte('date_encaissement', finMoisIso)

      const { data: depMois } = await supabase
        .from('depenses')
        .select('montant')
        .eq('societe_id', societe_id)
        .eq('is_archived', false)
        .gte('date_depense', debutMois)
        .lte('date_depense', finMois)

      const caMois = encMois
        ? encMois.reduce((s, e) => s + Number(e.montant_encaisse || 0), 0)
        : 0

      const depensesMois = depMois
        ? depMois.reduce((s, d) => s + Number(d.montant || 0), 0)
        : 0

      graphique_mois.push({
        mois: labelMois,
        ca: caMois,
        depenses: depensesMois,
        benefice: caMois - depensesMois,
      })
    }

    // -- Benefice par produit
    const { data: lignes } = await supabase
      .from('lignes_commande')
      .select(`
        quantite,
        prix_unitaire,
        total_ligne,
        produit_id,
        produits (
          nom_produit,
          categorie,
          prix_achat
        ),
        commandes!inner (
          societe_id,
          statut,
          date_livraison
        )
      `)
      .eq('commandes.societe_id', societe_id)
      .in('commandes.statut', ['LIVRE_PAYE', 'LIVRE_DETTE'])
      .gte('commandes.date_livraison', debut)
      .lte('commandes.date_livraison', fin)
      .eq('is_archived', false)

    const benefice_par_produit: Record<string, {
      nom: string
      categorie: string
      ca: number
      cout: number
      benefice: number
      quantite: number
    }> = {}

    if (lignes) {
      for (const ligne of lignes) {
        const produit = ligne.produits as {
          nom_produit: string
          categorie: string
          prix_achat: number | null
        } | null

        if (!produit) continue

        const nom = produit.nom_produit
        const ca_ligne = Number(ligne.total_ligne || 0)
        const prix_achat = Number(produit.prix_achat || 0)
        const cout_ligne = prix_achat * Number(ligne.quantite || 0)

        if (!benefice_par_produit[nom]) {
          benefice_par_produit[nom] = {
            nom,
            categorie: produit.categorie,
            ca: 0,
            cout: 0,
            benefice: 0,
            quantite: 0,
          
