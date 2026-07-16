import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

export async function GET(request: Request) {
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

  if (!isAuthorized(profil.role)) {
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
    if (t === 'ce_mois') {
      return {
        debut: format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
        fin: format(endOfMonth(aujourd_hui), 'yyyy-MM-dd'),
      }
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
  const dateAujourdhui = format(aujourd_hui, 'yyyy-MM-dd')

  const { data: livreurs } = await supabase
    .from('v_performance_livreurs')
    .select('*')
    .eq('societe_id', societe_id)

  const { data: clients } = await supabase
    .from('v_clients_dettes')
    .select('*')
    .eq('societe_id', societe_id)
    .order('dette_actuelle', { ascending: false })
    .limit(5)

  const { data: production } = await supabase
    .from('v_production_du_jour')
    .select('*')
    .eq('societe_id', societe_id)
    .eq('date_jour', dateAujourdhui)
    .maybeSingle()

  const { data: commandes } = await supabase
    .from('commandes')
    .select('statut')
    .eq('societe_id', societe_id)
    .gte('date_livraison', debut)
    .lte('date_livraison', fin)

  const commandes_par_statut: Record<string, number> = {}
  let nb_commandes_total = 0
  if (commandes) {
    for (const c of commandes) {
      commandes_par_statut[c.statut] = (commandes_par_statut[c.statut] || 0) + 1
      nb_commandes_total++
    }
  }

  const debutIso = debut + 'T00:00:00'
  const finIso = fin + 'T23:59:59'

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

  const { data: allDettes } = await supabase
    .from('v_clients_dettes')
    .select('dette_actuelle')
    .eq('societe_id', societe_id)

  let dette_totale = 0
  if (allDettes) {
    for (const d of allDettes) {
      dette_totale += Number(d.dette_actuelle || 0)
    }
  }

  const debut30j = format(subDays(aujourd_hui, 29), 'yyyy-MM-dd')
  const debut30jIso = debut30j + 'T00:00:00'
  const finAujIso = dateAujourdhui + 'T23:59:59'

  const { data: encaissements30j } = await supabase
    .from('encaissements')
    .select('montant_encaisse, date_encaissement')
    .eq('societe_id', societe_id)
    .gte('date_encaissement', debut30jIso)
    .lte('date_encaissement', finAujIso)

  const caParDate: Record<string, number> = {}
  if (encaissements30j) {
    for (const e of encaissements30j) {
      const date = String(e.date_encaissement).substring(0, 10)
      caParDate[date] = (caParDate[date] || 0) + Number(e.montant_encaisse || 0)
    }
  }

  const graphique_ca = []
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(aujourd_hui, i), 'yyyy-MM-dd')
    graphique_ca.push({
      date,
      ca: caParDate[date] || 0,
    })
  }

  return NextResponse.json({
    ca_periode,
    nb_commandes_total,
    nb_commandes_jour: nb_commandes_total,
    commandes_par_statut,
    dette_totale,
    top5_clients: clients || [],
    performance_livreurs: livreurs || [],
    graphique_ca,
    production: production || null,
    periode: { debut, fin, type },
  })
                              }
