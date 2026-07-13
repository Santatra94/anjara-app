'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  TrendingUp,
  Package,
  AlertCircle,
  Users,
  Truck,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react'
import GraphiqueCA from '@/components/dashboard/GraphiqueCA'
import type {
  DashboardAdminData,
  PeriodeFiltreType,
} from '@/types/dashboard'

function formatMontant(montant: number): string {
  return montant.toLocaleString('fr-MG') + ' Ar'
}

function getBadgeStatut(statut: string): { label: string; classe: string } {
  const map: Record<string, { label: string; classe: string }> = {
    EN_ATTENTE: { label: 'En attente', classe: 'bg-gray-100 text-gray-600' },
    EN_PREPARATION: { label: 'En preparation', classe: 'bg-violet-100 text-violet-700' },
    PRET: { label: 'Pret', classe: 'bg-blue-100 text-blue-700' },
    LIVRE_PAYE: { label: 'Livre paye', classe: 'bg-green-100 text-green-700' },
    LIVRE_DETTE: { label: 'Livre dette', classe: 'bg-orange-100 text-orange-700' },
  }
  return map[statut] || { label: statut, classe: 'bg-gray-100 text-gray-600' }
}

interface StatCardProps {
  titre: string
  valeur: string
  sousTitre?: string
  icone: React.ReactNode
  couleur: 'bleu' | 'violet' | 'orange' | 'vert'
}

function StatCard({ titre, valeur, sousTitre, icone, couleur }: StatCardProps) {
  const couleurs = {
    bleu: { bg: 'bg-blue-50', icone: 'bg-blue-100 text-blue-600', valeur: 'text-blue-700' },
    violet: { bg: 'bg-violet-50', icone: 'bg-violet-100 text-violet-600', valeur: 'text-violet-700' },
    orange: { bg: 'bg-orange-50', icone: 'bg-orange-100 text-orange-600', valeur: 'text-orange-700' },
    vert: { bg: 'bg-green-50', icone: 'bg-green-100 text-green-600', valeur: 'text-green-700' },
  }
  const c = couleurs[couleur]

  return (
    <div className={`rounded-xl p-5 ${c.bg} flex items-start gap-4`}>
      <div className={`rounded-lg p-2.5 ${c.icone} shrink-0`}>
        {icone}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{titre}</p>
        <p className={`text-xl font-bold mt-0.5 truncate ${c.valeur}`}>{valeur}</p>
        {sousTitre && <p className="text-xs text-gray-400 mt-0.5">{sousTitre}</p>}
      </div>
    </div>
  )
}

interface FiltrePeriodeProps {
  type: PeriodeFiltreType
  debut: string
  fin: string
  onChange: (type: PeriodeFiltreType, debut: string, fin: string) => void
}

function FiltrePeriode({ type, debut, fin, onChange }: FiltrePeriodeProps) {
  const today = new Date()
  const options: { value: PeriodeFiltreType; label: string }[] = [
    { value: 'aujourd_hui', label: "Aujourd'hui" },
    { value: 'ce_mois', label: 'Ce mois' },
    { value: 'mois_precedent', label: 'Mois precedent' },
    { value: 'personnalise', label: 'Personnalise' },
  ]

  function handleType(newType: PeriodeFiltreType) {
    if (newType === 'aujourd_hui') {
      const d = format(today, 'yyyy-MM-dd')
      onChange(newType, d, d)
    } else if (newType === 'ce_mois') {
      onChange(newType, format(startOfMonth(today), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'))
    } else if (newType === 'mois_precedent') {
      const moisPrec = subMonths(today, 1)
      onChange(newType, format(startOfMonth(moisPrec), 'yyyy-MM-dd'), format(endOfMonth(moisPrec), 'yyyy-MM-dd'))
    } else {
      onChange(newType, debut, fin)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleType(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            type === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {type === 'personnalise' && (
        <div className="flex items-center gap-2 mt-2 w-full">
          <input
            type="date"
            value={debut}
            onChange={(e) => onChange('personnalise', e.target.value, fin)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={fin}
            onChange={(e) => onChange('personnalise', debut, e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  )
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
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      setData(json)
    } catch {
      setErreur('Impossible de charger les donnees')
    } finally {
      setLoading(false)
    }
  }, [filtrePeriode, dateDebut, dateFin])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  function handleFiltreChange(type: PeriodeFiltreType, debut: string, fin: string) {
    setFiltrePeriode(type)
    setDateDebut(debut)
    setDateFin(fin)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-600">{erreur}</p>
          <button
            onClick={chargerDonnees}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const nbCommandesJour = data.nb_commandes_total || 0

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <button
          onClick={chargerDonnees}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">Periode</p>
        <FiltrePeriode
          type={filtrePeriode}
          debut={dateDebut}
          fin={dateFin}
          onChange={handleFiltreChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          titre="CA de la periode"
          valeur={formatMontant(data.ca_periode)}
          sousTitre={`Du ${format(new Date(dateDebut), 'd MMM', { locale: fr })} au ${format(new Date(dateFin), 'd MMM', { locale: fr })}`}
          icone={<TrendingUp className="w-5 h-5" />}
          couleur="bleu"
        />
        <StatCard
          titre="Commandes du jour"
          valeur={String(nbCommandesJour)}
          sousTitre={`${data.commandes_par_statut['LIVRE_PAYE'] || 0} payees / ${data.commandes_par_statut['LIVRE_DETTE'] || 0} en dette`}
          icone={<ShoppingBag className="w-5 h-5" />}
          couleur="violet"
        />
        <StatCard
          titre="Dette totale en cours"
          valeur={formatMontant(data.dette_totale)}
          sousTitre="Toutes commandes confondues"
          icone={<AlertCircle className="w-5 h-5" />}
          couleur="orange"
        />
        <StatCard
          titre="Clients actifs"
          valeur={String(data.top5_clients.length)}
          sousTitre="Avec dette en cours"
          icone={<Users className="w-5 h-5" />}
          couleur="vert"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            CA sur 30 jours
          </h2>
          <GraphiqueCA data={data.graphique_ca} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-500" />
            Production du jour
          </h2>
          {data.production ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-violet-50 p-4 text-center">
                <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Yaourts</p>
                <p className="text-3xl font-bold text-violet-700 mt-1">
                  {Number(data.production.total_yaourt_a_produire).toLocaleString()}
                </p>
                <p className="text-xs text-violet-400 mt-0.5">unites a produire</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Jus</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {Number(data.production.total_jus_a_produire).toLocaleString()}
                </p>
                <p className="text-xs text-blue-400 mt-0.5">unites a produire</p>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>{data.production.nb_commandes} commandes</span>
                <span>{data.production.nb_clients} clients</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Aucune production aujourd&apos;hui
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Commandes par statut - periode selectionnee
        </h2>
        {Object.keys(data.commandes_par_statut).length === 0 ? (
          <p className="text-sm text-gray-400">Aucune commande sur cette periode</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.commandes_par_statut).map(([statut, nb]) => {
              const badge = getBadgeStatut(statut)
              return (
                <div key={statut} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${badge.classe}`}>
                  <span className="text-sm font-medium">{badge.label}</span>
                  <span className="text-lg font-bold">{nb}</span>
                </div>
              )
            })}
          </div>
        
