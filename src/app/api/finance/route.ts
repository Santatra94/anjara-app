import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

type BeneficeProduit = {
  nom: string
  categorie: string
  ca: number
  cout: number
  benefice: number
  quantite: number
}

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

function extractProduit(raw: unknown): { nom_produit: string; categorie: string; prix_achat: number | null } | null {
  if (!raw) return null
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null
    return raw[0] as { nom_produit: string; categorie: string; prix_achat: number | null }
  }
  return raw as { nom_produit: string; categorie: string; prix_achat: number | null }
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
    const debutIso = debut + 'T00:00:00'
    const finIso = fin + 'T23:59:59'

    const { data: tousEncaissements } = await supabase.from('encaissements').select('montant_encaisse').eq('societe_id', societe_id)
    let total_encaissements = 0
    if (tousEncaissements) { for (const e of tousEncaissements) { total_encaissements += Number(e.montant_encaisse || 0) } }

    const { data: tousRecouvrements } = await supabase.from('recouvrements').select('montant_recouvre').eq('societe_id', societe_id).eq('is_archived', false)
    let total_recouvrements = 0
    if (tousRecouvrements) { for (const r of tousRecouvrements) { total_recouvrements += Number(r.montant_recouvre || 0) } }

    const { data: toutesDepenses } = await supabase.from('depenses').select('montant').eq('societe_id', societe_id).eq('is_archived', false)
    let total_depenses_global = 0
    if (toutesDepenses) { for (const d of toutesDepenses) { total_depenses_global += Number(d.montant || 0) } }

    const { data: tousMovements } = await supabase.from('mouvements_caisse').select('montant, type_mouvement').eq('societe_id', societe_id).eq('is_archived', false)
    let total_injections = 0
    let total_retraits = 0
    if (tousMovements) { for (const m of tousMovements) { if (m.type_mouvement === 'INJECTION') { total_injections += Number(m.montant || 0) } else { total_retraits += Number(m.montant || 0) } } }

    const solde_global = total_encaissements + total_recouvrements + total_injections - total_retraits - total_depenses_global

    const { data: depensesPeriode } = await supabase.from('depenses').select('montant, categorie').eq('societe_id', societe_id).eq('is_archived', false).gte('date_depense', debut).lte('date_depense', fin)
    let total_depenses_periode = 0
    let depenses_matieres = 0
    let depenses_hors_matieres = 0
    const depenses_par_categorie: Record<string, number> = {}
    if (depensesPeriode) {
      for (const d of depensesPeriode) {
        const montant = Number(d.montant || 0)
        total_depenses_periode += montant
        depenses_par_categorie[d.categorie] = (depenses_par_categorie[d.categorie] || 0) + montant
        if (d.categorie === 'MATIERES_PREMIERES') { depenses_matieres += montant } else { depenses_hors_matieres += montant }
      }
    }

    const { data: encaissementsPeriode } = await supabase.from('encaissements').select('montant_encaisse').eq('societe_id', societe_id).gte('date_encaissement', debutIso).lte('date_encaissement', finIso)
    let ca_periode = 0
    if (encaissementsPeriode) { for (const e of encaissementsPeriode) { ca_periode += Number(e.montant_encaisse || 0) } }

    const { data: lignes } = await supabase.from('lignes_commande').select(`quantite, total_ligne, produits ( nom_produit, categorie, prix_achat ), commandes!inner ( societe_id, statut, date_livraison )`).eq('commandes.societe_id', societe_id).in('commandes.statut', ['LIVRE_PAYE', 'LIVRE_DETTE']).gte('commandes.date_livraison', debut).lte('commandes.date_livraison', fin).eq('is_archived', false)

    const benefice_par_produit: Record<string, BeneficeProduit> = {}
    let ca_produits_total = 0
    let cout_produits_total = 0
    if (lignes) {
      for (const ligne of lignes) {
        const produit = extractProduit(ligne.produits)
        if (!produit) continue
        const nom = produit.nom_produit
        const ca_ligne = Number(ligne.total_ligne || 0)
        const prix_achat = Number(produit.prix_achat || 0)
        const quantite = Number(ligne.quantite || 0)
        const cout_ligne = prix_achat * quantite
        ca_produits_total += ca_ligne
        cout_produits_total += cout_ligne
        if (!benefice_par_produit[nom]) { benefice_par_produit[nom] = { nom, categorie: produit.categorie, ca: 0, cout: 0, benefice: 0, quantite: 0 } }
        benefice_par_produit[nom].ca += ca_ligne
        benefice_par_produit[nom].cout += cout_ligne
        benefice_par_produit[nom].benefice += ca_ligne - cout_ligne
        benefice_par_produit[nom].quantite += quantite
      }
    }
    const marge_brute = ca_produits_total - cout_produits_total
    const benefice_net = marge_brute - depenses_hors_matieres
    const benefice_produits = Object.values(benefice_par_produit).sort((a, b) => b.benefice - a.benefice)

    const graphique_mois = []
    for (let i = 5; i >= 0; i--) {
      const mois = subMonths(aujourd_hui, i)
      const debutMois = format(startOfMonth(mois), 'yyyy-MM-dd')
      const finMois = format(endOfMonth(mois), 'yyyy-MM-dd')
      const debutMoisIso = debutMois + 'T00:00:00'
      const finMoisIso = finMois + 'T23:59:59'
      const labelMois = format(mois, 'MMM yyyy')
      const { data: encMois } = await supabase.from('encaissements').select('montant_encaisse').eq('societe_id', societe_id).gte('date_encaissement', debutMoisIso).lte('date_encaissement', finMoisIso)
      const { data: depMois } = await supabase.from('depenses').select('montant').eq('societe_id', societe_id).eq('is_archived', false).gte('date_depense', debutMois).lte('date_depense', finMois)
      const caMois = encMois ? encMois.reduce((s, e) => s + Number(e.montant_encaisse || 0), 0) : 0
      const depMoisTotal = depMois ? depMois.reduce((s, d) => s + Number(d.montant || 0), 0) : 0
      graphique_mois.push({ mois: labelMois, ca: caMois, depenses: depMoisTotal, benefice: caMois - depMoisTotal })
    }

    const { data: mouvementsRecents } = await supabase.from('mouvements_caisse').select('*').eq('societe_id', societe_id).eq('is_archived', false).order('date_mouvement', { ascending: false }).limit(10)

    return NextResponse.json({
      solde_global, total_encaissements, total_recouvrements, total_injections, total_retraits,
      total_depenses_global, ca_periode, total_depenses_periode, depenses_matieres,
      depenses_hors_matieres, marge_brute, benefice_net, depenses_par_categorie,
      benefice_produits, graphique_mois,
      mouvements_recents: mouvementsRecents || [],
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
    if (!type_mouvement || !montant || !libelle) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    if (!['INJECTION', 'RETRAIT'].includes(type_mouvement)) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
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

    const { data: existing } = await supabase.from('mouvements_caisse').select('date_mouvement').eq('id', id).eq('societe_id', profil.societe_id).eq('is_archived', false).single()
    if (!existing) return NextResponse.json({ error: 'Mouvement introuvable' }, { status: 404 })

    if (profil.role === 'GERANT' && !isToday(existing.date_mouvement)) {
      return NextResponse.json({ error: 'Suppression impossible : seul le jour meme est autorise' }, { status: 403 })
    }

    const { error } = await supabase.from('mouvements_caisse').update({ is_archived: true }).eq('id', id).eq('societe_id', profil.societe_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
      } 
