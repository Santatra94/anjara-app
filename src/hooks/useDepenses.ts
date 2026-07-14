'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type DepenseCategorie =
  | 'MATIERES_PREMIERES'
  | 'SALAIRES'
  | 'TRANSPORT'
  | 'LOYER'
  | 'MARKETING'
  | 'CHARBON'
  | 'ELECTRICITE'
  | 'AUTRES'

export interface Depense {
  id: string
  societe_id: string
  categorie: DepenseCategorie
  libelle: string
  montant: number
  date_depense: string
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  is_archived: boolean
}

export interface DepenseFormData {
  categorie: DepenseCategorie
  libelle: string
  montant: number
  date_depense: string
  notes: string
}

export interface FiltresDepenses {
  categorie: 'TOUTES' | DepenseCategorie
  dateDebut: string
  dateFin: string
}

export const DEPENSES_CATEGORIES: Array<{
  value: DepenseCategorie
  label: string
}> = [
  { value: 'MATIERES_PREMIERES', label: 'Matieres premieres' },
  { value: 'SALAIRES', label: 'Salaires' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CHARBON', label: 'Charbon' },
  { value: 'ELECTRICITE', label: 'Electricite' },
  { value: 'AUTRES', label: 'Autres' },
]

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0]
}

export function getDefaultDepensesFilters(): FiltresDepenses {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    categorie: 'TOUTES',
    dateDebut: toDateInputValue(firstDay),
    dateFin: toDateInputValue(now),
  }
}

export function getDepenseCategorieLabel(categorie: DepenseCategorie) {
  const item = DEPENSES_CATEGORIES.find((entry) => entry.value === categorie)
  return item ? item.label : categorie
}

export function getDepenseCategorieBadgeClass(categorie: DepenseCategorie) {
  if (categorie === 'MATIERES_PREMIERES') {
    return 'bg-blue-100 text-blue-700'
  }
  if (categorie === 'SALAIRES') {
    return 'bg-violet-100 text-violet-700'
  }
  if (categorie === 'TRANSPORT') {
    return 'bg-amber-100 text-amber-700'
  }
  if (categorie === 'LOYER') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (categorie === 'MARKETING') {
    return 'bg-pink-100 text-pink-700'
  }
  if (categorie === 'CHARBON') {
    return 'bg-slate-200 text-slate-800'
  }
  if (categorie === 'ELECTRICITE') {
    return 'bg-yellow-100 text-yellow-700'
  }
  return 'bg-gray-100 text-gray-700'
}

export function formatMontantAriary(montant: number) {
  return new Intl.NumberFormat('fr-FR').format(Number(montant || 0)) + ' Ar'
}

function buildQueryString(filtres: FiltresDepenses) {
  const params = new URLSearchParams()

  if (filtres.categorie && filtres.categorie !== 'TOUTES') {
    params.set('categorie', filtres.categorie)
  }

  if (filtres.dateDebut) {
    params.set('date_debut', filtres.dateDebut)
  }

  if (filtres.dateFin) {
    params.set('date_fin', filtres.dateFin)
  }

  const query = params.toString()
  return query ? '?' + query : ''
}

async function parseApiResponse(response: Response) {
  const json = await response.json()

  if (!response.ok) {
    throw new Error(json.error || 'Erreur API')
  }

  return json
}

export function useDepenses() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [filtres, setFiltres] = useState<FiltresDepenses>(getDefaultDepensesFilters())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepenses = useCallback(async (filtresActuels: FiltresDepenses) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/depenses' + buildQueryString(filtresActuels), {
        method: 'GET',
        cache: 'no-store',
      })

      const json = await parseApiResponse(response)
      setDepenses(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur chargement depenses'
      setError(message)
      setDepenses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDepenses(filtres)
  }, [fetchDepenses, filtres])

  const createDepense = useCallback(
    async (payload: DepenseFormData) => {
      setSaving(true)

      try {
        const response = await fetch('/api/depenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        await parseApiResponse(response)
        toast.success('Depense ajoutee')
        await fetchDepenses(filtres)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur ajout depense'
        toast.error(message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [fetchDepenses, filtres]
  )

  const updateDepense = useCallback(
    async (id: string, payload: DepenseFormData) => {
      setSaving(true)

      try {
        const response = await fetch('/api/depenses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            ...payload,
          }),
        })

        await parseApiResponse(response)
        toast.success('Depense modifiee')
        await fetchDepenses(filtres)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur modification depense'
        toast.error(message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [fetchDepenses, filtres]
  )

  const deleteDepense = useCallback(
    async (id: string) => {
      setSaving(true)

      try {
        const response = await fetch('/api/depenses?id=' + id, {
          method: 'DELETE',
        })

        await parseApiResponse(response)
        toast.success('Depense supprimee')
        await fetchDepenses(filtres)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur suppression depense'
        toast.error(message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [fetchDepenses, filtres]
  )

  const totalDepenses = depenses.reduce((sum, depense) => {
    return sum + Number(depense.montant || 0)
  }, 0)

  return {
    depenses,
    filtres,
    setFiltres,
    loading,
    saving,
    error,
    totalDepenses,
    refresh: () => fetchDepenses(filtres),
    createDepense,
    updateDepense,
    deleteDepense,
  }
    }
