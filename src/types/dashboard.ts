// Types pour les dashboards Anjara

export interface ClientDette {
  client_id: string
  nom_pdv: string
  societe_id: string
  dette_actuelle: number
}

export interface PerformanceLivreur {
  livreur_id: string
  livreur_nom: string
  societe_id: string
  encaisse_aujourdhui: number
  recouvre_aujourdhui: number
  encaisse_ce_mois: number
  recouvre_ce_mois: number
  total_encaisse: number
  total_recouvre: number
  total_dette: number
  nb_commandes: number
}

export interface CompteLivreur {
  livreur_id: string
  livreur_nom: string
  societe_id: string
  date_jour: string
  total_encaissements_jour: number
  total_recouvrements_jour: number
  total_a_reverser: number
}

export interface ProductionDuJour {
  societe_id: string
  date_jour: string
  total_yaourt_a_produire: number
  total_jus_a_produire: number
  nb_commandes: number
  nb_clients: number
}

export interface EcartCommande {
  commande_id: string
  code_commande: string
  societe_id: string
  client_id: string
  nom_pdv: string
  statut: string
  yaourt_demande: number
  yaourt_prepare: number
  ecart_yaourt: number
  jus_demande: number
  jus_prepare: number
  ecart_jus: number
  statut_preparation: string
}

export interface PointCA {
  date: string
  ca: number
}

export interface DashboardAdminData {
  ca_periode: number
  nb_commandes_total: number
  nb_commandes_jour: number
  commandes_par_statut: Record<string, number>
  dette_totale: number
  top5_clients: ClientDette[]
  performance_livreurs: PerformanceLivreur[]
  graphique_ca: PointCA[]
  production: ProductionDuJour | null
}

export interface DashboardLivreurData {
  compte: CompteLivreur | null
  nb_commandes_livrees: number
  nb_commandes_restantes: number
  dette_en_cours: number
  nb_clients_visites: number
  encaisse_ce_mois: number
  recouvre_ce_mois: number
  performance: PerformanceLivreur | null
}

export type PeriodeFiltreType = 'aujourd_hui' | 'ce_mois' | 'mois_precedent' | 'personnalise'

export interface FiltrePeriode {
  type: PeriodeFiltreType
  date_debut: string
  date_fin: string
}
