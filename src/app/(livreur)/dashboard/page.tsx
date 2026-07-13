'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DashboardData {
  livreur_nom: string
  compte: {
    total_encaissements_jour: number
    total_recouvrements_jour: number
    total_a_reverser: number
  } | null
  nb_commandes_livrees: number
  nb_commandes_restantes: number
  nb_clients_visites: number
  dette_en_cours: number
  nb_preparations: number
  nb_livraisons: number
  nb_recouvrements: number
}

function formatMontant(m: number): string {
  return m.toLocaleString('fr-MG') + ' Ar'
}

export default function DashboardLivreurPage() {
  const router = useRouter()
  const today = new Date()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const chargerDonnees = useCallback(async function () {
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/dashboard/livreur')
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
  }, [])

  useEffect(function () {
    chargerDonnees()
  }, [chargerDonnees])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-red-500">{erreur}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const caisseJour = data.compte ? Number(data.compte.total_a_reverser) : 0
  const dateJour = format(today, "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 space-y-4 max-w-lg mx-auto">

        <div className="pt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {data.livreur_nom}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{dateJour}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-lg">
          <p className="text-xs uppercase tracking-wide opacity-80 font-medium">Ma caisse aujourdhui</p>
          <p className="text-4xl font-bold mt-2">{formatMontant(caisseJour)}</p>
          <p className="text-sm opacity-90 mt-1">A reverser au bureau</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Livrees</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{data.nb_commandes_livrees}</p>
            <p className="text-xs text-gray-400 mt-1">Aujourdhui</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Restantes</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">{data.nb_commandes_restantes}</p>
            <p className="text-xs text-gray-400 mt-1">A livrer</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Mes dettes en cours</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{formatMontant(data.dette_en_cours)}</p>
              <p className="text-xs text-gray-400 mt-1">A recouvrer</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Clients visites</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{data.nb_clients_visites}</p>
              <p className="text-xs text-gray-400 mt-1">Aujourdhui</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-4">Ce que je dois faire</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">
                  {data.nb_preparations}
                </div>
                <span className="text-sm font-medium text-violet-900">Preparations</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {data.nb_livraisons}
                </div>
                <span className="text-sm font-medium text-blue-900">Livraisons</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  {data.nb_recouvrements}
                </div>
                <span className="text-sm font-medium text-orange-900">Recouvrements</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={function () { router.push('/tournee') }}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold text-base shadow-sm hover:bg-blue-700 transition-colors"
        >
          Voir ma tournee complete
        </button>

      </div>
    </div>
  )
}
