'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Boxes, AlertTriangle, Plus, Trash2, ChefHat,
  ArrowDownCircle, ArrowUpCircle, Warehouse, TrendingUp,
  History, Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useStock } from '@/hooks/useStock'
import { useProductions } from '@/hooks/useProductions'
import { useRecettes, useRecetteDetail } from '@/hooks/useRecettes'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type Onglet = 'stock' | 'mouvements' | 'productions'

type Matiere = { id: string; nom: string; unite: string }
type Produit = { id: string; nom_produit: string; categorie: string }

type MouvementForm = {
  type_mouvement: 'ENTREE_ACHAT' | 'PERTE' | 'AJUSTEMENT' | 'RETOUR_VENTE'
  ressource_type: 'MATIERE' | 'PRODUIT'
  ressource_id: string
  quantite: string
  unite: string
  prix_unitaire: string
  notes: string
  date_mouvement: string
}

type ProductionForm = {
  produit_id: string
  quantite_produite: string
  date_production: string
  notes: string
  recette_id: string
  matieres: { matiere_id: string; quantite_consommee: string; unite: string }[]
}

type InventaireItem = {
  ressource_type: 'MATIERE' | 'PRODUIT'
  ressource_id: string
  ressource_nom: string
  unite: string
  quantite: string
}

const TYPES_LABEL: Record<string, string> = {
  ENTREE_ACHAT: 'Entree achat',
  SORTIE_PRODUCTION: 'Sortie production',
  ENTREE_PRODUCTION: 'Entree production',
  SORTIE_VENTE: 'Vente',
  RETOUR_VENTE: 'Retour vente',
  PERTE: 'Perte',
  AJUSTEMENT: 'Ajustement',
}

const TYPES_COLOR: Record<string, string> = {
  ENTREE_ACHAT: 'bg-emerald-100 text-emerald-700',
  SORTIE_PRODUCTION: 'bg-orange-100 text-orange-700',
  ENTREE_PRODUCTION: 'bg-blue-100 text-blue-700',
  SORTIE_VENTE: 'bg-purple-100 text-purple-700',
  RETOUR_VENTE: 'bg-cyan-100 text-cyan-700',
  PERTE: 'bg-red-100 text-red-700',
  AJUSTEMENT: 'bg-gray-100 text-gray-700',
}

function fmtQte(n: number, unite: string): string {
  const rounded = Math.round(n * 1000) / 1000
  return new Intl.NumberFormat('fr-FR').format(rounded) + ' ' + unite
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR')
  } catch {
    return dateStr
  }
}

const MVT_FORM_DEFAULT: MouvementForm = {
  type_mouvement: 'ENTREE_ACHAT',
  ressource_type: 'MATIERE',
  ressource_id: '',
  quantite: '',
  unite: 'unite',
  prix_unitaire: '',
  notes: '',
  date_mouvement: new Date().toISOString().split('T')[0],
}

const PROD_FORM_DEFAULT: ProductionForm = {
  produit_id: '',
  quantite_produite: '',
  date_production: new Date().toISOString().split('T')[0],
  notes: '',
  recette_id: '',
  matieres: [],
}
export default function StockPage() {
  const { user } = useAuth()
  const { stock, nbAlertes, mouvements, productionsRecentes, isLoading: loadingStock, refresh: refreshStock } = useStock()
  const { productions, refresh: refreshProductions } = useProductions()
  const { recettes } = useRecettes()

  const [onglet, setOnglet] = useState<Onglet>('stock')
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [loadingListes, setLoadingListes] = useState(true)

  // Modales
  const [modalMvt, setModalMvt] = useState(false)
  const [modalProd, setModalProd] = useState(false)
  const [modalInventaire, setModalInventaire] = useState(false)
  const [prodASupprimer, setProdASupprimer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [mvtForm, setMvtForm] = useState<MouvementForm>(MVT_FORM_DEFAULT)
  const [prodForm, setProdForm] = useState<ProductionForm>(PROD_FORM_DEFAULT)
  const [inventaireItems, setInventaireItems] = useState<InventaireItem[]>([])

  // Recette selectionnee dans production
  const { matieres: recetteMatieres, isLoading: loadingRecette } = useRecetteDetail(
    prodForm.recette_id || null
  )

  const loadListes = useCallback(async () => {
    if (!user?.utilisateur?.societe_id) return
    setLoadingListes(true)
    const supabase = createClient()

    const { data: mats } = await supabase
      .from('matieres_premieres')
      .select('id, nom, unite')
      .eq('societe_id', user.utilisateur.societe_id)
      .eq('is_archived', false)
      .eq('actif', true)
      .order('nom')

    const { data: prods } = await supabase
      .from('produits')
      .select('id, nom_produit, categorie')
      .eq('societe_id', user.utilisateur.societe_id)
      .eq('is_archived', false)
      .eq('actif', true)
      .order('nom_produit')

    setMatieres(mats || [])
    setProduits(prods || [])
    setLoadingListes(false)
  }, [user])

  useEffect(() => {
    loadListes()
  }, [loadListes])

  // Pre-remplir matieres quand une recette est selectionnee dans production
  useEffect(() => {
    if (prodForm.recette_id && !loadingRecette && recetteMatieres.length > 0 && prodForm.quantite_produite) {
      const recette = recettes.find(r => r.id === prodForm.recette_id)
      if (!recette) return
      const ratio = Number(prodForm.quantite_produite) / recette.quantite_batch
      setProdForm(prev => ({
        ...prev,
        matieres: recetteMatieres.map(rm => ({
          matiere_id: rm.matiere_id,
          quantite_consommee: String(Math.round(rm.quantite * ratio * 1000) / 1000),
          unite: rm.unite,
        })),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodForm.recette_id, prodForm.quantite_produite, loadingRecette])
    function resetMvtForm() {
    setMvtForm(MVT_FORM_DEFAULT)
  }

  function resetProdForm() {
    setProdForm(PROD_FORM_DEFAULT)
  }

  function openMvt(ressourceId?: string, ressourceType?: 'MATIERE' | 'PRODUIT') {
    resetMvtForm()
    if (ressourceId && ressourceType) {
      setMvtForm({ ...MVT_FORM_DEFAULT, ressource_id: ressourceId, ressource_type: ressourceType })
    }
    setModalMvt(true)
  }

  function openInventaire() {
    // Pre-remplir avec stock actuel
    setInventaireItems(
      stock.map(s => ({
        ressource_type: s.ressource_type,
        ressource_id: s.ressource_id,
        ressource_nom: s.ressource_nom,
        unite: s.unite,
        quantite: String(s.quantite_totale),
      }))
    )
    setModalInventaire(true)
  }

  async function handleSaveMvt() {
    if (!mvtForm.ressource_id || !mvtForm.quantite) {
      toast.error('Ressource et quantite obligatoires')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mvtForm,
          quantite: Number(mvtForm.quantite),
          prix_unitaire: mvtForm.prix_unitaire ? Number(mvtForm.prix_unitaire) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success('Mouvement enregistre')
      setModalMvt(false)
      resetMvtForm()
      await refreshStock()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProd() {
    if (!prodForm.produit_id || !prodForm.quantite_produite || Number(prodForm.quantite_produite) <= 0) {
      toast.error('Produit et quantite obligatoires')
      return
    }
    setSaving(true)
    try {
      const payload = {
        produit_id: prodForm.produit_id,
        quantite_produite: Number(prodForm.quantite_produite),
        date_production: prodForm.date_production,
        notes: prodForm.notes.trim() || null,
        recette_id: prodForm.recette_id || null,
        matieres: prodForm.matieres
          .filter(m => m.matiere_id && Number(m.quantite_consommee) > 0)
          .map(m => ({
            matiere_id: m.matiere_id,
            quantite_consommee: Number(m.quantite_consommee),
            unite: m.unite,
          })),
      }
      const res = await fetch('/api/productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success('Production enregistree')
      setModalProd(false)
      resetProdForm()
      await Promise.all([refreshStock(), refreshProductions()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveInventaire() {
    setSaving(true)
    try {
      const items = inventaireItems
        .filter(i => i.quantite !== '')
        .map(i => ({
          ressource_type: i.ressource_type,
          ressource_id: i.ressource_id,
          quantite: Number(i.quantite),
          unite: i.unite,
        }))
      const res = await fetch('/api/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success('Inventaire enregistre : ' + json.count + ' ajustement(s)')
      setModalInventaire(false)
      await refreshStock()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProd() {
    if (!prodASupprimer) return
    try {
      const res = await fetch('/api/productions?id=' + prodASupprimer, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Production supprimee')
      setProdASupprimer(null)
      await Promise.all([refreshStock(), refreshProductions()])
    } catch {
      toast.error('Erreur suppression')
    }
  }

  function addProdMatiere() {
    setProdForm({
      ...prodForm,
      matieres: [...prodForm.matieres, { matiere_id: '', quantite_consommee: '', unite: 'unite' }],
    })
  }

  function updateProdMatiere(idx: number, patch: Partial<{ matiere_id: string; quantite_consommee: string; unite: string }>) {
    const updated = [...prodForm.matieres]
    updated[idx] = { ...updated[idx], ...patch }
    if (patch.matiere_id) {
      const m = matieres.find(x => x.id === patch.matiere_id)
      if (m) updated[idx].unite = m.unite
    }
    setProdForm({ ...prodForm, matieres: updated })
  }

  function removeProdMatiere(idx: number) {
    setProdForm({ ...prodForm, matieres: prodForm.matieres.filter((_, i) => i !== idx) })
  }

  function updateInventaireItem(idx: number, quantite: string) {
    const updated = [...inventaireItems]
    updated[idx] = { ...updated[idx], quantite }
    setInventaireItems(updated)
  }
    if (loadingStock || loadingListes) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  const stockMatieres = stock.filter(s => s.ressource_type === 'MATIERE')
  const stockProduits = stock.filter(s => s.ressource_type === 'PRODUIT')
  const enAlerte = stock.filter(s => s.en_alerte)

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Warehouse className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Stock</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stockMatieres.length} matieres - {stockProduits.length} produits
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openInventaire}>
            <Settings2 className="h-4 w-4 mr-2" />
            Inventaire
          </Button>
          <Button variant="outline" size="sm" onClick={() => { resetMvtForm(); setModalMvt(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Mouvement
          </Button>
          <Button onClick={() => { resetProdForm(); setModalProd(true) }}>
            <ChefHat className="h-4 w-4 mr-2" />
            Production
          </Button>
        </div>
      </div>

      {/* ALERTE STOCK FAIBLE */}
      {enAlerte.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                {enAlerte.length} ressource{enAlerte.length > 1 ? 's' : ''} en alerte stock
              </h3>
              <p className="text-xs text-red-700">
                Verifiez les stocks faibles et reapprovisionnez si necessaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ONGLETS */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setOnglet('stock')}
            className={
              'flex-1 py-3 px-4 text-sm font-medium transition-colors ' +
              (onglet === 'stock'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            <Boxes className="h-4 w-4 inline mr-2" />
            Stock actuel
          </button>
          <button
            onClick={() => setOnglet('mouvements')}
            className={
              'flex-1 py-3 px-4 text-sm font-medium transition-colors ' +
              (onglet === 'mouvements'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            <History className="h-4 w-4 inline mr-2" />
            Mouvements
          </button>
          <button
            onClick={() => setOnglet('productions')}
            className={
              'flex-1 py-3 px-4 text-sm font-medium transition-colors ' +
              (onglet === 'productions'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            <ChefHat className="h-4 w-4 inline mr-2" />
            Productions
          </button>
        </div>

        <div className="p-4">
          {/* ONGLET STOCK */}
          {onglet === 'stock' && (
            <div className="space-y-6">
              {/* Matieres */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Matieres premieres ({stockMatieres.length})
                </h3>
                {stockMatieres.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">Aucune matiere.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stockMatieres.map((s) => (
                      <div
                        key={s.ressource_id}
                        className={
                          'border rounded-lg p-3 ' +
                          (s.en_alerte ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900 text-sm">{s.ressource_nom}</p>
                          <button
                            onClick={() => openMvt(s.ressource_id, 'MATIERE')}
                            className="text-gray-400 hover:text-blue-600"
                            title="Ajouter mouvement"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className={'text-lg font-bold ' + (s.en_alerte ? 'text-red-600' : 'text-gray-900')}>
                          {fmtQte(s.quantite_totale, s.unite)}
                        </p>
                        {s.seuil_alerte > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Seuil : {fmtQte(s.seuil_alerte, s.unite)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Produits */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  Produits finis ({stockProduits.length})
                </h3>
                {stockProduits.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">Aucun produit.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stockProduits.map((s) => (
                      <div
                        key={s.ressource_id}
                        className={
                          'border rounded-lg p-3 ' +
                          (s.en_alerte ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900 text-sm">{s.ressource_nom}</p>
                          <button
                            onClick={() => openMvt(s.ressource_id, 'PRODUIT')}
                            className="text-gray-400 hover:text-blue-600"
                            title="Ajouter mouvement"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className={'text-lg font-bold ' + (s.en_alerte ? 'text-red-600' : 'text-gray-900')}>
                          {fmtQte(s.quantite_totale, s.unite)}
                        </p>
                        {s.seuil_alerte > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Seuil : {fmtQte(s.seuil_alerte, s.unite)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ONGLET MOUVEMENTS */}
          {onglet === 'mouvements' && (
            <div className="space-y-2">
              {mouvements.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Aucun mouvement encore.</p>
              ) : (
                mouvements.map((m) => {
                  const isPositive = m.quantite > 0
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' +
                          (isPositive ? 'bg-emerald-100' : 'bg-red-100')
                        }>
                          {isPositive
                            ? <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                            : <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {m.ressource_nom}
                            </p>
                            <span className={
                              'inline-flex px-1.5 py-0.5 rounded text-xs font-medium ' +
                              (TYPES_COLOR[m.type_mouvement] || 'bg-gray-100')
                            }>
                              {TYPES_LABEL[m.type_mouvement] || m.type_mouvement}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {fmtDate(m.date_mouvement)}
                            {m.notes && ' -- ' + m.notes}
                          </p>
                        </div>
                      </div>
                      <span className={
                        'font-semibold text-sm ml-2 ' +
                        (isPositive ? 'text-emerald-600' : 'text-red-600')
                      }>
                        {isPositive ? '+' : ''}{fmtQte(m.quantite, m.unite)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ONGLET PRODUCTIONS */}
          {onglet === 'productions' && (
            <div className="space-y-2">
              {productions.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Aucune production encore.</p>
              ) : (
                productions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <ChefHat className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.produit?.nom_produit || 'Produit'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmtDate(p.date_production)}
                          {p.notes && ' -- ' + p.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">
                        +{fmtQte(p.quantite_produite, 'unite')}
                      </span>
                      {user?.utilisateur?.role === 'ADMIN' && (
                        <button
                          onClick={() => setProdASupprimer(p.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
            {/* MODAL MOUVEMENT */}
      <Dialog open={modalMvt} onOpenChange={(open) => { if (!open) { setModalMvt(false); resetMvtForm() } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau mouvement de stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={mvtForm.type_mouvement}
                  onValueChange={(v) => setMvtForm({ ...mvtForm, type_mouvement: v as MouvementForm['type_mouvement'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREE_ACHAT">Entree achat</SelectItem>
                    <SelectItem value="PERTE">Perte / Casse</SelectItem>
                    <SelectItem value="RETOUR_VENTE">Retour vente</SelectItem>
                    <SelectItem value="AJUSTEMENT">Ajustement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ressource</Label>
                <Select
                  value={mvtForm.ressource_type}
                  onValueChange={(v) => setMvtForm({
                    ...mvtForm,
                    ressource_type: v as 'MATIERE' | 'PRODUIT',
                    ressource_id: '',
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATIERE">Matiere</SelectItem>
                    <SelectItem value="PRODUIT">Produit fini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{mvtForm.ressource_type === 'MATIERE' ? 'Matiere' : 'Produit'} *</Label>
              <Select
                value={mvtForm.ressource_id}
                onValueChange={(v) => {
                  const list = mvtForm.ressource_type === 'MATIERE' ? matieres : produits
                  const item = list.find(x => x.id === v)
                  setMvtForm({
                    ...mvtForm,
                    ressource_id: v,
                    unite: item && 'unite' in item ? item.unite : 'unite',
                  })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {(mvtForm.ressource_type === 'MATIERE' ? matieres : produits).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {'nom' in r ? r.nom : r.nom_produit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantite *</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Ex: 20"
                  value={mvtForm.quantite}
                  onChange={(e) => setMvtForm({ ...mvtForm, quantite: e.target.value })}
                />
                {mvtForm.type_mouvement === 'AJUSTEMENT' && (
                  <p className="text-xs text-gray-400">Peut etre negatif</p>
                )}
                {mvtForm.type_mouvement === 'PERTE' && (
                  <p className="text-xs text-gray-400">Toujours retire</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={mvtForm.date_mouvement}
                  onChange={(e) => setMvtForm({ ...mvtForm, date_mouvement: e.target.value })}
                />
              </div>
            </div>

            {mvtForm.type_mouvement === 'ENTREE_ACHAT' && (
              <div className="space-y-1.5">
                <Label>Prix unitaire (optionnel)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ar / unite"
                  value={mvtForm.prix_unitaire}
                  onChange={(e) => setMvtForm({ ...mvtForm, prix_unitaire: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Details..."
                value={mvtForm.notes}
                onChange={(e) => setMvtForm({ ...mvtForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setModalMvt(false); resetMvtForm() }} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveMvt} disabled={saving || !mvtForm.ressource_id || !mvtForm.quantite}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL INVENTAIRE */}
      <Dialog open={modalInventaire} onOpenChange={(open) => { if (!open) setModalInventaire(false) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventaire initial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">
              Saisissez la quantite actuelle en stock pour chaque ressource. Un ajustement sera cree pour aligner le stock.
            </p>
            {inventaireItems.map((item, idx) => (
              <div key={item.ressource_type + item.ressource_id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.ressource_nom}</p>
                  <p className="text-xs text-gray-400">{item.ressource_type === 'MATIERE' ? 'Matiere' : 'Produit'}</p>
                </div>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-24"
                  value={item.quantite}
                  onChange={(e) => updateInventaireItem(idx, e.target.value)}
                />
                <span className="text-xs text-gray-500 w-14">{item.unite}</span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalInventaire(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveInventaire} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Valider l\'inventaire'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            {/* MODAL PRODUCTION */}
      <Dialog open={modalProd} onOpenChange={(open) => { if (!open) { setModalProd(false); resetProdForm() } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle production</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Produit */}
            <div className="space-y-1.5">
              <Label>Produit fabrique *</Label>
              <Select
                value={prodForm.produit_id}
                onValueChange={(v) => {
                  // Chercher recette pour ce produit
                  const rec = recettes.find(r => r.produit_id === v)
                  setProdForm({
                    ...prodForm,
                    produit_id: v,
                    recette_id: rec ? rec.id : '',
                    matieres: rec ? [] : prodForm.matieres, // Reset si nouvelle recette
                  })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                <SelectContent>
                  {produits.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom_produit} ({p.categorie})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantite + date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantite produite *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.001"
                  placeholder="Ex: 100"
                  value={prodForm.quantite_produite}
                  onChange={(e) => setProdForm({ ...prodForm, quantite_produite: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date de production</Label>
                <Input
                  type="date"
                  value={prodForm.date_production}
                  onChange={(e) => setProdForm({ ...prodForm, date_production: e.target.value })}
                />
              </div>
            </div>

            {/* Recette (auto-suggeree) */}
            {prodForm.recette_id && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ChefHat className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-900">Recette detectee</p>
                </div>
                <p className="text-xs text-purple-700">
                  Les matieres sont pre-remplies proportionnellement a la quantite produite.
                </p>
              </div>
            )}

            {/* Matieres consommees */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Matieres consommees</Label>
                <Button size="sm" variant="outline" type="button" onClick={addProdMatiere}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              {prodForm.matieres.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Aucune matiere. Ajoutez-en ou choisissez un produit avec recette.
                </p>
              ) : (
                <div className="space-y-2">
                  {prodForm.matieres.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={line.matiere_id}
                          onValueChange={(v) => updateProdMatiere(idx, { matiere_id: v })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Matiere" /></SelectTrigger>
                          <SelectContent>
                            {matieres.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.nom} ({m.unite})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="Qte"
                        value={line.quantite_consommee}
                        onChange={(e) => updateProdMatiere(idx, { quantite_consommee: e.target.value })}
                        className="w-20 h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500 mt-2 w-10">{line.unite}</span>
                      <button
                        onClick={() => removeProdMatiere(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Remarques sur la production..."
                value={prodForm.notes}
                onChange={(e) => setProdForm({ ...prodForm, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-900">Impact stock automatique</p>
              </div>
              <p className="text-xs text-blue-700">
                Les matieres seront deduites du stock et le produit fini y sera ajoute.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setModalProd(false); resetProdForm() }} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveProd} disabled={saving || !prodForm.produit_id || !prodForm.quantite_produite}>
              {saving ? 'Enregistrement...' : 'Enregistrer production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION SUPPRESSION PRODUCTION */}
      <AlertDialog open={!!prodASupprimer} onOpenChange={(open) => { if (!open) setProdASupprimer(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette production ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les mouvements de stock associes seront aussi annules. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProd} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
