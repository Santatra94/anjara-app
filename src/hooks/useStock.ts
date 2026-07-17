'use client'

import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'

export type StockItem = {
  ressource_type: 'MATIERE' | 'PRODUIT'
  ressource_id: string
  ressource_nom: string
  unite: string
  quantite_totale: number
  seuil_alerte: number
  en_alerte: boolean
}

export type MouvementStock = {
  id: string
  type_mouvement: 'ENTREE_ACHAT' | 'SORTIE_PRODUCTION' | 'ENTREE_PRODUCTION'
    | 'SORTIE_VENTE' | 'RETOUR_VENTE' | 'PERTE' | 'AJUSTEMENT'
  ressource_type: 'MATIERE' | 'PRODUIT'
  ressource_id: string
  ressource_nom: string
  quantite: number
  unite: string
  date_mouvement: string
  notes: string | null
  created_at: string
}

export type ProductionRecente = {
  id: string
  produit_id: string
  produit_nom: string
  quantite_produite: number
  date_production: string
  notes: string | null
  created_at: string
}

export type StockSummary = {
  stock: StockItem[]
  nb_alertes: number
  nb_matieres: number
  nb_produits: number
  mouvements_recents: MouvementStock[]
  productions_recentes: ProductionRecente[]
  role: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erreur chargement')
  }
  return res.json()
}

export function useStock() {
  const { user } = useAuth()
  const societeId = user?.utilisateur?.societe_id || null

  const { data, error, isLoading, mutate } = useSWR<StockSummary>(
    societeId ? ['stock', societeId] : null,
    () => fetcher('/api/stock'),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    stock: data?.stock || [],
    nbAlertes: data?.nb_alertes || 0,
    nbMatieres: data?.nb_matieres || 0,
    nbProduits: data?.nb_produits || 0,
    mouvements: data?.mouvements_recents || [],
    productionsRecentes: data?.productions_recentes || [],
    role: data?.role,
    isLoading,
    error,
    refresh: mutate,
  }
} 
