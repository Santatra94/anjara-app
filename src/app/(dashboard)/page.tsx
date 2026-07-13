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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMontant(montant: number): string {
  return montant.toLocaleString('fr-MG') + ' Ar'
}

function getBadgeStatut(statut: string): { label: string; classe: string } {
  const map: Record<string, { label: string; classe: string }> = {
    EN_ATTENTE: { label: 'En attente', classe: 'bg-gray-100 text-gray-600' },
    EN_PREPARATION: { label: 'En préparation', classe: 'bg-violet-100 text-violet-700' },
    PRET: { label: 'Prêt', classe: 'bg-blue-100 text-blue-700' },
    LIVRE_PAYE: { label: 'Livré payé', classe: 'bg-green-100 text-green-700' },
    LIVRE_DETTE: { label: 'Livré dette', classe: 'bg-orange-100 text-orange-700' },
  }
  return map[statut] || { label: statut, classe: 'bg-gray-100 text-gray-600' }
}

// ─── Composant StatCard ────────────────────────────────────────────────────────

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

// ─── Composant FiltrePeriode ───────────────────────────────────────────────────

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
    { value: 'mois_precedent', label: 'Mois précédent' },
    { value: 'personnalise', label: 'Personnalisé' },
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
          <span className="text-gray-400 text-sm">→</span>
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

// ─── Page principale ───────────────────────────────────────────────────────────

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
      setErreur('Impossible de charger les données')
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

  // ── Rendu loading ──
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

  // ── Rendu erreur ──
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
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const nbCommandesJour = data.nb_commandes_total || 0

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <button
          onClick={chargerDonnees}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm 
