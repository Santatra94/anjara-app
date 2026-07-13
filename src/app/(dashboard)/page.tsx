'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import GraphiqueCA from '@/components/dashboard/GraphiqueCA'
import StatCard from '@/components/dashboard/StatCard'
import type { DashboardAdminData, PeriodeFiltreType } from '@/types/dashboard'

function formatMontant(m: number): string {
  return m.toLocaleString('fr-MG') + ' Ar'
}

export default function DashboardAdminPage() {
  const today = new Date()

  const [data, setData] = useState<DashboardAdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [filtrePeriode, setFiltrePeriode] = useState<PeriodeFiltreType>('ce_mois')
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [dateFin, setDateFin] = useState(format(today, 'yyyy-MM-dd'))

  const chargerDonnees = useCallback(async () => {
    setLoading(true)
    setErreur(null)
    try {
      const params = new URLSearchParams({
        type: filtrePeriode,
        debut: dateDebut,
        fin: dateFin,
      })
      const res = await fetch(`/api/dashboard/admin?${params}`)
      if (!res.ok) throw new Error('Erreur')
      const json = await res.json()
      setData(json)
    } catch {
      setErreur('Impossible de charger')
    } finally {
      setLoading(false)
    }
  }, [filtrePeriode, dateDebut, dateFin])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  function setPeriode(type: PeriodeFiltreType) {
    setFiltrePeriode(type)
    if (type === 'aujourd_hui') {
      const d = format(today, 'yyyy-MM-dd')
      setDateDebut(d)
      setDateFin(d)
    } else if (type === 'ce_mois') {
      setDateDebut(format(startOfMonth(today), 'yyyy-MM-dd'))
      setDateFin(format(today, 'yyyy-MM-dd'))
    } else if (type === 'mois_precedent') {
      const mp = subMonths(today, 1)
      setDateDebut(format(startOfMonth(mp), 'yyyy-MM-dd'))
      setDateFin(format(endOfMonth(mp), 'yyyy-MM-dd'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-red-500">{erreur}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(today, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="bg-white 
