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

function classeButtonPeriode(actif: boolean): string {
  const base = 'px-3 py-1.5 rounded-lg text-sm font-medium '
  if (actif) {
    return base + 'bg-blue-600 text-white'
  }
  return base + 'bg-gray-100 text-gray-600 hover:bg-gray-200'
}

export default function DashboardAdminPage() {
  const today = new Date()

  const [data, setData] = useState<DashboardAdminData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [filtrePeriode, setFiltrePeriode] = useState<PeriodeFiltreType>('ce_mois')
  const [dateDebut, setDateDebut] = useState<string>(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [dateFin, setDateFin] = useState<string>(format(today, 'yyyy-MM-dd'))

  const chargerDonnees = useCallback(async function () {
    setLoading(true)
    setErreur(null)
    try {
      const params = new URLSearchParams({
        type: filtrePeriode,
        debut: dateDebut,
        fin: dateFin,
      })
      const res = await fetch('/api/dashboard/admin?' + params.toString())
      if (!res.ok) {
        throw new Error('Erreur')
      }
      const json = await res.json()
      setData(json)
       } catch {
      setErreur('Impossible de charger les donnees')
    } finally {
      setLoading(false)
    }
  }, [filtrePeriode, dateDebut, dateFin])

  useEffect(function () {
    chargerDonnees()
  }, [chargerDonnees])

  function setPeriode(type: PeriodeFiltreType) {
    setFiltrePeriode(type)
    if (type === 'aujourd_hui') {
      const d = format(today, 'yyyy-MM-dd')
      setDateDebut(d)
      setDateFin(d)
      return
    }
    if (type === 'ce_mois') {
      setDateDebut(format(startOfMonth(today), 'yyyy-MM-dd'))
      setDateFin(format(today, 'yyyy-MM-dd'))
      return
    }
    if (type === 'mois_precedent') {
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

  const dateJour = format(today, "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{dateJour}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-medium mb-3 uppercase">Periode</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={function () { setPeriode('aujourd_hui') }}
            className={classeButtonPeriode(filtrePeriode === 'aujourd_hui')}
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={function () { setPeriode('ce_mois') }}
            className={classeButtonPeriode(filtrePeriode === 'ce_mois')}
          >
            Ce mois
          </button>
          <button
            onClick={function () { setPeriode('mois_precedent') }}
            className={classeButtonPeriode(filtrePeriode === 'mois_precedent')}
          >
            Mois precedent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          titre="CA de la periode"
          valeur={formatMontant(data.ca_periode)}
          icone={<span>CA</span>}
          couleur="bleu"
        />
        <StatCard
          titre="Commandes du jour"
          valeur={String(data.nb_commandes_total || 0)}
          icone={<span>CMD</span>}
          couleur="violet"
        />
        <StatCard
          titre="Dette totale"
          valeur={formatMontant(data.dette_totale)}
          icone={<span>D</span>}
          couleur="orange"
        />
        <StatCard
          titre="Clients"
          valeur={String(data.top5_clients.length)}
          icone={<span>C</span>}
          couleur="vert"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">CA sur 30 jours</h2>
        <GraphiqueCA data={data.graphique_ca} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance livreurs</h2>
        {data.performance_livreurs.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun livreur</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-500">Livreur</th>
                <th className="text-right py-2 text-xs text-gray-500">Encaisse auj.</th>
                <th className="text-right py-2 text-xs text-gray-500">Recouvre auj.</th>
                <th className="text-right py-2 text-xs text-gray-500">Dette</th>
              </tr>
            </thead>
            <tbody>
              {data.performance_livreurs.map(function (l) {
                return (
                  <tr key={l.livreur_id} className="border-b border-gray-50">
                    <td className="py-3 font-medium">{l.livreur_nom}</td>
                    <td className="py-3 text-right text-green-600">
                      {Number(l.encaisse_aujourdhui).toLocaleString()} Ar
                    </td>
                    <td className="py-3 text-right text-blue-600">
                      {Number(l.recouvre_aujourdhui).toLocaleString()} Ar
                    </td>
                    <td className="py-3 text-right text-orange-600">
                      {Number(l.total_dette).toLocaleString()} Ar
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 5 clients - dettes</h2>
        {data.top5_clients.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune dette</p>
        ) : (
          <div className="space-y-2">
            {data.top5_clients.map(function (c, i) {
              return (
                <div key={c.client_id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm">#{i + 1} {c.nom_pdv}</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {Number(c.dette_actuelle).toLocaleString()} Ar
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
