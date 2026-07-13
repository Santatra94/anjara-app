import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function GET() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { data: profil, error: profilError } = await supabase
    .from('utilisateurs')
    .select('id, societe_id, role, nom')
    .eq('id', user.id)
    .single()

  if (profilError || !profil) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
  }

  if (profil.role !== 'LIVREUR') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
  }

  const societe_id = profil.societe_id
  const livreur_id = profil.id
  const aujourd_hui = new Date()
  const dateAujourdhui = format(aujourd_hui, 'yyyy-MM-dd')

  // 1. Caisse du jour
  const { data: compte } = await supabase
    .from('v_compte_jour_livreur')
    .select('*')
    .eq('societe_id', societe_id)
    .eq('livreur_id', livreur_id)
    .eq('date_jour', dateAujourdhui)
    .maybeSingle()

  // 2. Tâches restantes du jour depuis v_tournee_du_jour
  const { data: taches } = await supabase
    .from('v_tournee_du_jour')
    .select('type_tache, statut_actuel, dette_restante')
    .eq('societe_id', societe_id)
    .eq('livreur_id', livreur_id)
    .eq('date_tache', dateAujourdhui)

  let nb_preparations = 0
  let nb_livraisons = 0
  let nb_recouvrements = 0

  if (taches) {
    for (const t of taches) {
      if (t.type_tache === 'PREPARATION') {
        nb_preparations++
      }
      if (t.type_tache === 'LIVRAISON') {
        nb_livraisons++
      }
      if (t.type_tache === 'RECOUVREMENT') {
        nb_recouvrements++
      }
    }
  }

  // 3. Commandes DEJA LIVREES aujourd'hui (table commandes)
  const debutJour = dateAujourdhui + 'T00:00:00'
  const finJour = dateAujourdhui + 'T23:59:59'

  const { data: commandesLivrees } = await supabase
    .from('commandes')
    .select('client_id, statut')
    .eq('societe_id', societe_id)
    .eq('livreur_assigne_id', livreur_id)
    .in('statut', ['LIVRE_PAYE', 'LIVRE_DETTE'])
    .gte('date_livraison_effective', debutJour)
    .lte('date_livraison_effective', finJour)

  const nb_commandes_livrees = commandesLivrees ? commandesLivrees.length : 0
  const nb_commandes_restantes = nb_livraisons

  const clientsUniquesVisites = new Set<string>()
  if (commandesLivrees) {
    for (const c of commandesLivrees) {
      if (c.client_id) {
        clientsUniquesVisites.add(c.client_id)
      }
    }
  }

  // 4. Dettes totales du livreur (toutes commandes LIVRE_DETTE)
  const { data: recouvrementsAll } = await supabase
    .from('v_tournee_du_jour')
    .select('dette_restante')
    .eq('societe_id', societe_id)
    .eq('livreur_id', livreur_id)
    .eq('type_tache', 'RECOUVREMENT')

  let dette_en_cours = 0
  if (recouvrementsAll) {
    for (const r of recouvrementsAll) {
      dette_en_cours += Number(r.dette_restante || 0)
    }
  }

  return NextResponse.json({
    livreur_nom: profil.nom || 'Livreur',
    compte: compte || null,
    nb_commandes_livrees,
    nb_commandes_restantes,
    nb_clients_visites: clientsUniquesVisites.size,
    dette_en_cours,
    nb_preparations,
    nb_livraisons,
    nb_recouvrements,
  })
}
