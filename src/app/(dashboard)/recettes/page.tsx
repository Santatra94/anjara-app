'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ChefHat, AlertTriangle, Edit2, Trash2, Package } from 'lucide-react'
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
import { useRecettes, useRecetteDetail } from '@/hooks/useRecettes'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type Matiere = { id: string; nom: string; unite: string; prix_unitaire_defaut: number | null }

type MatiereLine = {
  matiere_id: string
  quantite: string
  unite: string
}

type ChargeLine = {
  categorie: string
  montant_batch: string
  notes: string
}

const CATEGORIES_CHARGES = [
  { value: 'CHARBON', label: 'Charbon' },
  { value: 'ELECTRICITE', label: 'Electricite' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'AUTRES', label: 'Autres' },
]

function fmtAr(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' Ar'
}

function catBadge(cat: string): string {
  const colors: Record<string, string> = {
    YAOURT: 'bg-blue-100 text-blue-700',
    JUS: 'bg-orange-100 text-orange-700',
  }
  return colors[cat] || 'bg-gray-100 text-gray-700'
}
export default function RecettesPage() {
  const { user } = useAuth()
  const { recettes, produitsSansRecette, isLoading, refresh } = useRecettes()
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [loadingMatieres, setLoadingMatieres] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [aSupprimer, setASupprimer] = useState<string | null>(null)

  // Form state
  const [produitId, setProduitId] = useState('')
  const [quantiteBatch, setQuantiteBatch] = useState('100')
  const [notes, setNotes] = useState('')
  const [matieresLines, setMatieresLines] = useState<MatiereLine[]>([])
  const [chargesLines, setChargesLines] = useState<ChargeLine[]>([])

  const { matieres: existingMatieres, charges: existingCharges, isLoading: loadingDetail } =
    useRecetteDetail(editingId)

  const loadMatieres = useCallback(async () => {
    if (!user?.utilisateur?.societe_id) return
    setLoadingMatieres(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('matieres_premieres')
      .select('id, nom, unite, prix_unitaire_defaut')
      .eq('societe_id', user.utilisateur.societe_id)
      .eq('is_archived', false)
      .eq('actif', true)
      .order('nom')
    setMatieres(data || [])
    setLoadingMatieres(false)
  }, [user])

  useEffect(() => {
    loadMatieres()
  }, [loadMatieres])

  // Pre-remplir en edition
  useEffect(() => {
    if (editingId && !loadingDetail && existingMatieres.length > 0) {
      setMatieresLines(
        existingMatieres.map((m) => ({
          matiere_id: m.matiere_id,
          quantite: String(m.quantite),
          unite: m.unite || 'unite',
        }))
      )
    }
    if (editingId && !loadingDetail && existingCharges.length > 0) {
      setChargesLines(
        existingCharges.map((c) => ({
          categorie: c.categorie,
          montant_batch: String(c.montant_batch),
          notes: c.notes || '',
        }))
      )
    }
  }, [editingId, loadingDetail, existingMatieres, existingCharges])

  function resetForm() {
    setProduitId('')
    setQuantiteBatch('100')
    setNotes('')
    setMatieresLines([])
    setChargesLines([])
    setEditingId(null)
  }

  function openCreate(produitIdPrefill?: string) {
    resetForm()
    if (produitIdPrefill) setProduitId(produitIdPrefill)
    setModalOpen(true)
  }

  function openEdit(recette: { id: string; produit_id: string; quantite_batch: number; notes: string | null }) {
    resetForm()
    setEditingId(recette.id)
    setProduitId(recette.produit_id)
    setQuantiteBatch(String(recette.quantite_batch))
    setNotes(recette.notes || '')
    setModalOpen(true)
  }

  function addMatiereLine() {
    setMatieresLines([...matieresLines, { matiere_id: '', quantite: '', unite: 'unite' }])
  }

  function updateMatiereLine(idx: number, patch: Partial<MatiereLine>) {
    const updated = [...matieresLines]
    updated[idx] = { ...updated[idx], ...patch }
    // Auto-remplir unite quand on choisit matiere
    if (patch.matiere_id) {
      const m = matieres.find((x) => x.id === patch.matiere_id)
      if (m) updated[idx].unite = m.unite
    }
    setMatieresLines(updated)
  }

  function removeMatiereLine(idx: number) {
    setMatieresLines(matieresLines.filter((_, i) => i !== idx))
  }

  function addChargeLine() {
    setChargesLines([...chargesLines, { categorie: 'CHARBON', montant_batch: '', notes: '' }])
  }

  function updateChargeLine(idx: number, patch: Partial<ChargeLine>) {
    const updated = [...chargesLines]
    updated[idx] = { ...updated[idx], ...patch }
    setChargesLines(updated)
  }

  function removeChargeLine(idx: number) {
    setChargesLines(chargesLines.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!produitId || !quantiteBatch || Number(quantiteBatch) <= 0) {
      toast.error('Produit et quantite obligatoires')
      return
    }
    setSaving(true)
    try {
      const payload = {
        produit_id: produitId,
        quantite_batch: Number(quantiteBatch),
        notes: notes.trim() || null,
        matieres: matieresLines
          .filter((m) => m.matiere_id && Number(m.quantite) > 0)
          .map((m) => ({
            matiere_id: m.matiere_id,
            quantite: Number(m.quantite),
            unite: m.unite,
          })),
        charges: chargesLines
          .filter((c) => c.categorie && Number(c.montant_batch) >= 0)
          .map((c) => ({
            categorie: c.categorie,
            montant_batch: Number(c.montant_batch),
            notes: c.notes.trim() || null,
          })),
      }

      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...payload } : payload

      const res = await fetch('/api/recettes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')

      toast.success(editingId ? 'Recette modifiee' : 'Recette creee')
      setModalOpen(false)
      resetForm()
      await refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!aSupprimer) return
    try {
      const res = await fetch('/api/recettes?id=' + aSupprimer, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Recette supprimee')
      setASupprimer(null)
      await refresh()
    } catch {
      toast.error('Erreur suppression')
    }
    }
    if (isLoading || loadingMatieres) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Recettes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Composition et cout de revient de chaque produit
            </p>
          </div>
        </div>
        <Button onClick={() => openCreate()} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle recette
        </Button>
      </div>

      {/* ALERTE PRODUITS SANS RECETTE */}
      {produitsSansRecette.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                {produitsSansRecette.length} produit{produitsSansRecette.length > 1 ? 's' : ''} sans recette
              </h3>
              <p className="text-xs text-amber-700 mb-3">
                Le cout de revient est imprecis. Creez une recette pour chaque produit.
              </p>
              <div className="flex flex-wrap gap-2">
                {produitsSansRecette.map((p) => (
                  <button
                    key={p.produit_id}
                    onClick={() => openCreate(p.produit_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {p.produit_nom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTE RECETTES */}
      {recettes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune recette encore</p>
          <p className="text-xs text-gray-400 mt-1">
            Commencez par creer une recette pour vos produits
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recettes.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {r.produit?.nom_produit || 'Produit inconnu'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {r.produit?.categorie && (
                      <span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + catBadge(r.produit.categorie)}>
                        {r.produit.categorie}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Batch : {r.quantite_batch}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setASupprimer(r.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {r.cout && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Cout matieres</span>
                    <span className="font-medium text-gray-700">{fmtAr(r.cout.cout_matieres)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Cout charges</span>
                    <span className="font-medium text-gray-700">{fmtAr(r.cout.cout_charges)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Total batch</span>
                    <span className="font-semibold text-gray-900">{fmtAr(r.cout.cout_total_batch)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1.5 border-t border-gray-200">
                    <span className="text-purple-700 font-semibold">Cout unitaire</span>
                    <span className="font-bold text-purple-700">{fmtAr(r.cout.cout_unitaire)}</span>
                  </div>
                </div>
              )}

              {r.notes && (
                <p className="text-xs text-gray-500 mt-3 italic line-clamp-2">
                  {r.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
            {/* MODAL FORMULAIRE */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la recette' : 'Nouvelle recette'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Produit */}
            <div className="space-y-1.5">
              <Label>Produit *</Label>
              <Select
                value={produitId}
                onValueChange={setProduitId}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produitsSansRecette.map((p) => (
                    <SelectItem key={p.produit_id} value={p.produit_id}>
                      {p.produit_nom} ({p.produit_categorie})
                    </SelectItem>
                  ))}
                  {editingId && (
                    <SelectItem value={produitId}>
                      {recettes.find((r) => r.id === editingId)?.produit?.nom_produit || 'Produit'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {editingId && (
                <p className="text-xs text-gray-400">Le produit ne peut pas etre change</p>
              )}
            </div>

            {/* Quantite batch */}
            <div className="space-y-1.5">
              <Label>Quantite produite par batch *</Label>
              <Input
                type="number"
                min="1"
                value={quantiteBatch}
                onChange={(e) => setQuantiteBatch(e.target.value)}
                placeholder="Ex: 100"
              />
              <p className="text-xs text-gray-400">
                Ex: 100 yaourts, 50 bouteilles de jus...
              </p>
            </div>

            {/* Matieres premieres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Matieres premieres</Label>
                <Button size="sm" variant="outline" type="button" onClick={addMatiereLine}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              {matieresLines.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Aucune matiere. Cliquez sur Ajouter.
                </p>
              ) : (
                <div className="space-y-2">
                  {matieresLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={line.matiere_id}
                          onValueChange={(v) => updateMatiereLine(idx, { matiere_id: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Matiere" />
                          </SelectTrigger>
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
                        value={line.quantite}
                        onChange={(e) => updateMatiereLine(idx, { quantite: e.target.value })}
                        className="w-20 h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500 mt-2 w-10">{line.unite}</span>
                      <button
                        onClick={() => removeMatiereLine(idx)}
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

            {/* Charges de production */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Charges de production (par batch)</Label>
                <Button size="sm" variant="outline" type="button" onClick={addChargeLine}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Ex: charbon, electricite, gaz consommes pour ce batch
              </p>
              {chargesLines.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Aucune charge. Optionnel.
                </p>
              ) : (
                <div className="space-y-2">
                  {chargesLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={line.categorie}
                          onValueChange={(v) => updateChargeLine(idx, { categorie: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES_CHARGES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Montant"
                        value={line.montant_batch}
                        onChange={(e) => updateChargeLine(idx, { montant_batch: e.target.value })}
                        className="w-24 h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500 mt-2">Ar</span>
                      <button
                        onClick={() => removeChargeLine(idx)}
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
                placeholder="Instructions, remarques..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm() }} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !produitId || !quantiteBatch}>
              {saving ? 'Enregistrement...' : (editingId ? 'Modifier' : 'Creer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION SUPPRESSION */}
      <AlertDialog open={!!aSupprimer} onOpenChange={(open) => { if (!open) setASupprimer(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette recette ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Les couts de revient repasseront au prix indicatif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
