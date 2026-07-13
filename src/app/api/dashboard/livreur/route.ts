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

  // 2. Tâches du jour depuis v_tournee_du_jour
  const { data: taches } = await supabase
    .from('v_tournee_du_jour')
    .select('type_tache, statut_actuel, client_id, dette_restante')
    .eq('societe_id', societe_id)
    .eq('livreur_id', livreur_id)
    .eq('date_tache', dateAujourdhui)

  let nb_preparations = 0
  let nb_livraisons = 0
  let nb_recouvrements = 0
  let nb_commandes_livrees = 0
  let nb_commandes_restantes = 0
  const clientsUniquesVisites = new Set<string>()

  const statutsLivres = ['LIVRE_PAYE', 'LIVRE_DETTE']

  if (taches) {
    for (const t of taches) {
      if (t.type_tache === 'PREPARATION') {
        nb_preparations++
      }
      if (t.type_tache === 'LIVRAISON') {
        if (statutsLivres.includes(t.statut_actuel)) {
          nb_commandes_livrees++
          if (t.client_id) {
            clientsUniquesVisites.add(t.client_id)
          }
        } else {
          nb_livraisons++
          nb_commandes_restantes++
        }
      }
      if (t.type_tache === 'RECOUVREMENT') {
        nb_recouvrements++
      }
    }
  }

  // 3. Dettes totales du livreur (commandes LIVRE_DETTE assignées à lui)
  const { data: commandesDette } = await supabase
    .from('v_tournee_du_jour')
    .select('dette_restante')
    .eq('societe_id', societe_id)
    .eq('livreur_id', livreur_id)
    .eq('type_tache', 'RECOUVREMENT')

  let dette_en_cours = 0
  if (commandesDette) {
    for (const c of commandesDette) {
      dette_en_cours += Number(c.dette_restante || 0)
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
