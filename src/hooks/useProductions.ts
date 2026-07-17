'use client'

import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'

export type ProductionProduit = {
  id: string
  nom_produit: string
  categorie: string
}

export type ProductionLite = {
  id: string
  societe_id: string
  produit_id: string
  recette_id: string | null
  quantite_produite: number
  date_production: string
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  produit: ProductionProduit | null
}

export type ProductionMatiereLine = {
  id: string
  production_id: string
  matiere_id: string
  quantite_consommee: number
  unite: string
  matiere: {
    id: string
    nom: string
    unite: string
  } | null
}

export type ProductionDetail = {
  production: ProductionLite
  matieres: ProductionMatiereLine[]
  role: string
}

type ListResponse = {
  productions: ProductionLite[]
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

export function useProductions() {
  const { user } = useAuth()
  const societeId = user?.utilisateur?.societe_id || null

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    societeId ? ['productions', societeId] : null,
    () => fetcher('/api/productions'),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    productions: data?.productions || [],
    role: data?.role,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useProductionDetail(productionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProductionDetail>(
    productionId ? ['production-detail', productionId] : null,
    () => fetcher('/api/productions?id=' + productionId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    }
  )

  return {
    production: data?.production || null,
    matieres: data?.matieres || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
