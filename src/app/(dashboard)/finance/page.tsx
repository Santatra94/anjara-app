'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getDepenseCategorieLabel, getDepenseCategorieBadgeClass } from '@/hooks/useDepenses'
import { toast } from 'sonner'

type PeriodeType = 'aujourd_hui' | 'ce_mois' | 'mois_precedent' | 'personnalise'

type MouvementCaisse = {
  id: string
  type_mouvement: 'INJECTION' | 'RETRAIT'
  montant: number
  libelle: string
  date_mouvement: string
  notes: string | null
}

type BeneficeProduit = {
  nom: string
  categorie: string
  ca: number
  cout: number
  benefice: number
  quantite: number
}

type FinanceData = {
  solde_global: number
  total_encaissements: number
  total_recouvrements: number
  total_injections: number
  total_retraits: number
  total_depenses_global: number
  ca_periode: number
  total_depenses_periode: number
  depenses_matieres: number
  depenses_hors_matieres: number
  marge_brute: number
  benefice_net: number
  depenses_par_categorie: Record<string, number>
  benefice_produits: BeneficeProduit[]
  graphique_mois: Array<{
    mois: string
    ca: number
    depenses: number
    benefice: number
  }>
  mouvements_recents: MouvementCaisse[]
  periode: { debut: string; fin: string; type: string }
}

type MouvementForm = {
  type_mouvement: 'INJECTION' | 'RETRAIT'
  montant: string
  libelle: string
  date_mouvement: string
  notes: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' Ar'
}

function classeBtn(actif: boolean) {
  const base = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors '
  if (actif) return base + 'bg-blue-600 text-white'
  return base + 'bg-gray-100 text-gray-600 hover:bg-gray-200'
}

function SoldeBadge({ valeur }: { valeur: number }) {
  const positif = valeur >= 0
  return (
    <span className={positif ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
      {positif ? '+' : ''}{fmt(valeur)}
    </span>
  )
}

export default function FinancePage() {
  const today = new Date()

  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [periode, setPeriodeType] = useState<PeriodeType>('ce_mois')
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [dateFin, setDateFin] = useState(format(today, 'yyyy-MM-dd'))
  const [modalMvt, setModalMvt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mvtASupprimer, setMvtASupprimer] = useState<MouvementCaisse | null>(null)
  const [form, setForm] = useState<MouvementForm>({
    type_mouvement: 'INJECTION',
    montant: '',
    libelle: '',
    date_mouvement: format(today, 'yyyy-MM-dd'),
    notes: '',
  })

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur(null)
    try {
      const params = new URLSearchParams({
        type: periode,
        debut: dateDebut,
        fin: dateFin,
      })
      const res = await fetch('/api/finance?' + params.toString())
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      setData(json)
    } catch {
      setErreur('Impossible de charger les donnees finance')
    } finally {
      setLoading(false)
    }
  }, [periode, dateDebut, dateFin])

  useEffect(() => {
    charger()
  }, [charger])

  function changerPeriode(type: PeriodeType) {
    setPeriodeType(type)
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

  async function handleSaveMouvement() {
    if (!form.libelle.trim() || !form.montant) return
    setSaving(true)
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          montant: Number(form.montant),
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success(form.type_mouvement === 'INJECTION' ? 'Injection enregistree' : 'Retrait enregistre')
      setModalMvt(false)
      setForm({
        type_mouvement: 'INJECTION',
        montant: '',
        libelle: '',
        date_mouvement: format(today, 'yyyy-MM-dd'),
        notes: '',
      })
      await charger()
    } catch {
      toast.error('Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function handleSupprimer() {
    if (!mvtASupprimer) return
    try {
      const res = await fetch('/api/finance?id=' + mvtASupprimer.id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Mouvement supprime')
      setMvtASupprimer(null)
      await charger()
    } catch {
      toast.error('Erreur suppression')
    }
  }

  const dateJour = format(today, "EEEE d MMMM yyyy", { locale: fr })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (erreur || !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-red-500">{erreur || 'Erreur inconnue'}</p>
      </div>
    )
  }

  const categoriesEntries = Object.entries(data.depenses_par_categorie).sort(
    (a, b) => b[1] - a[1]
  )

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dateJour}</p>
        </div>
        <Button onClick={() => setModalMvt(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Injection / Retrait
        </Button>
      </div>

      {/* Filtre periode */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-medium mb-3 uppercase">Periode</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => changerPeriode('aujourd_hui')} className={classeBtn(periode === 'aujourd_hui')}>
            Aujourd&apos;hui
          </button>
          <button onClick={() => changerPeriode('ce_mois')} className={classeBtn(periode === 'ce_mois')}>
            Ce mois
          </button>
          <button onClick={() => changerPeriode('mois_precedent')} className={classeBtn(periode === 'mois_precedent')}>
            Mois precedent
          </button>
          <button onClick={() => changerPeriode('personnalise')} className={classeBtn(periode === 'personnalise')}>
            Personnalise
          </button>
        </div>
        {periode === 'personnalise' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Du</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Au</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-9" />
            </div>
          </div>
        )}
      </div>

      {/* 3 cards principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Solde global</p>
          </div>
          <p className={
            'text-2xl font-bold ' +
            (data.solde_global >= 0 ? 'text-emerald-600' : 'text-red-600')
          }>
            {fmt(data.solde_global)}
          </p>
          <p className="text-xs text-gray-400">Depuis le debut de l&apos;activite</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Benefice net</p>
          </div>
          <p className={
            'text-2xl font-bold ' +
            (data.benefice_net >= 0 ? 'text-emerald-600' : 'text-red-600')
          }>
            {fmt(data.benefice_net)}
          </p>
          <p className="text-xs text-gray-400">Marge brute - depenses hors matieres</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Depenses periode</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(data.total_depenses_periode)}</p>
          <p className="text-xs text-gray-400">
            Matieres : {fmt(data.depenses_matieres)} | Autres : {fmt(data.depenses_hors_matieres)}
          </p>
        </div>
      </div>

      {/* Detail solde global */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Detail du solde global</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Encaissements totaux</span>
            <SoldeBadge valeur={data.total_encaissements} />
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Recouvrements totaux</span>
            <SoldeBadge valeur={data.total_recouvrements} />
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Injections</span>
            <SoldeBadge valeur={data.total_injections} />
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Retraits</span>
            <span className="text-red-600 font-bold">-{fmt(data.total_retraits)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">Depenses totales</span>
            <span className="text-red-600 font-bold">-{fmt(data.total_depenses_global)}</span>
          </div>
          <div className="flex justify-between py-2 pt-3">
            <span className="font-bold text-gray-900">Solde</span>
            <SoldeBadge valeur={data.solde_global} />
          </div>
        </div>
      </div>

      {/* Graphique CA vs Depenses 6 mois */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">CA vs Depenses (6 mois)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.graphique_mois} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1000) + 'k'} />
            <Tooltip formatter={(value: number) => fmt(value)} />
            <Legend />
            <Bar dataKey="ca" name="CA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="depenses" name="Depenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="benefice" name="Benefice" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Repartition depenses par categorie */}
      {categoriesEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Repartition depenses par categorie
          </h2>
          <div className="space-y-3">
            {categoriesEntries.map(([cat, montant]) => {
              const pct = data.total_depenses_periode > 0
                ? Math.round((montant / data.total_depenses_periode) * 100)
                : 0
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' +
                        getDepenseCategorieBadgeClass(cat as Parameters<typeof getDepenseCategorieBadgeClass>[0])
                      }
                    >
                      {getDepenseCategorieLabel(cat as Parameters<typeof getDepenseCategorieLabel>[0])}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {fmt(montant)} <span className="text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-red-400 h-1.5 rounded-full"
                      style={{ width: pct + '%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Benefice par produit */}
      {data.benefice_produits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Benefice par produit</h2>
          <p className="text-xs text-gray-400 mb-4">
            Base sur prix_achat de chaque produit. Marge brute periode : {fmt(data.marge_brute)}
          </p>

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Produit</th>
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Categorie</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Qte</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">CA</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Cout fab.</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Benefice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.benefice_produits.map((p) => (
                  <tr key={p.nom} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{p.nom}</td>
                    <td className="px-3 py-3">
                      <span className={
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' +
                        (p.categorie === 'YAOURT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')
                      }>
                        {p.categorie}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">{p.quantite}</td>
                    <td className="px-3 py-3 text-right text-blue-600">{fmt(p.ca)}</td>
                    <td className="px-3 py-3 text-right text-red-500">{fmt(p.cout)}</td>
                    <td className={
                      'px-3 py-3 text-right font-bold ' +
                      (p.benefice >= 0 ? 'text-emerald-600' : 'text-red-600')
                    }>
                      {fmt(p.benefice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {data.benefice_produits.map((p) => (
              <div key={p.nom} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">{p.nom}</p>
                  <span className={
                    'text-sm font-bold ' +
                    (p.benefice >= 0 ? 'text-emerald-600' : 'text-red-600')
                  }>
                    {fmt(p.benefice)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <p className="text-gray-400">CA</p>
                    <p className="font-medium text-blue-600">{fmt(p.ca)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cout</p>
                    <p className="font-medium text-red-500">{fmt(p.cout)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Qte</p>
                    <p className="font-medium text-gray-700">{p.quantite}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mouvements caisse recents */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Mouvements caisse recents</h2>
          <Button size="sm" variant="outline" onClick={() => setModalMvt(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        {data.mouvements_recents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun mouvement</p>
        ) : (
          <div className="space-y-2">
            {data.mouvements_recents.map((m) => (
              <div
                key={m.id
