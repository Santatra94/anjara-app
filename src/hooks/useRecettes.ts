'use client'

import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'

export type RecetteCout = {
  cout_matieres: number
  cout_charges: number
  cout_total_batch: number
  cout_unitaire: number
  quantite_batch: number
}

export type RecetteProduit = {
  id: string
  nom_produit: string
  categorie: string
  prix?: number
  prix_achat?: number | null
}

export type RecetteLite = {
  id: string
  societe_id: string
  produit_id: string
  quantite_batch: number
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  produit: RecetteProduit | null
  cout: RecetteCout | null
}

export type ProduitSansRecette = {
  produit_id: string
  produit_nom: string
  produit_categorie: string
}

export type RecetteMatiereLine = {
  id: string
  recette_id: string
  matiere_id: string
  quantite: number
  unite: string
  matiere: {
    id: string
    nom: string
    unite: string
  } | null
}

export type RecetteChargeLine = {
  id: string
  recette_id: string
  categorie: string
  montant_batch: number
  notes: string | null
}

export type RecetteDetail = {
  recette: RecetteLite
  matieres: RecetteMatiereLine[]
  charges: RecetteChargeLine[]
  cout: RecetteCout | null
  role: string
}

type ListResponse = {
  recettes: RecetteLite[]
  produits_sans_recette: ProduitSansRecette[]
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

export function useRecettes() {
  const { profile } = useAuth()
  const societeId = profile?.societe_id || null

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    societeId ? ['recettes', societeId] : null,
    () => fetcher('/api/recettes'),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    recettes: data?.recettes || [],
    produitsSansRecette: data?.produits_sans_recette || [],
    role: data?.role,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useRecetteDetail(recetteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<RecetteDetail>(
    recetteId ? ['recette-detail', recetteId] : null,
    () => fetcher('/api/recettes?id=' + recetteId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    }
  )

  return {
    recette: data?.recette || null,
    matieres: data?.matieres || [],
    charges: data?.charges || [],
    cout: data?.cout || null,
    isLoading,
    error,
    refresh: mutate,
  }
    }
