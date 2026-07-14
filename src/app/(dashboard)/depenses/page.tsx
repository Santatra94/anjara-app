'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  useDepenses,
  DEPENSES_CATEGORIES,
  getDepenseCategorieLabel,
  getDepenseCategorieBadgeClass,
  formatMontantAriary,
  type Depense,
  type DepenseFormData,
  type DepenseCategorie,
} from '@/hooks/useDepenses'
import { Plus, Pencil, Trash2, TrendingDown, Filter } from 'lucide-react'

const FORM_DEFAULT: DepenseFormData = {
  categorie: 'AUTRES',
  libelle: '',
  montant: 0,
  date_depense: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function DepensesPage() {
  const {
    depenses,
    filtres,
    setFiltres,
    loading,
    saving,
    totalDepenses,
    createDepense,
    updateDepense,
    deleteDepense,
  } = useDepenses()

  const [modalOuvert, setModalOuvert] = useState(false)
  const [depenseAEditer, setDepenseAEditer] = useState<Depense | null>(null)
  const [depenseASupprimer, setDepenseASupprimer] = useState<Depense | null>(null)
  const [form, setForm] = useState<DepenseFormData>(FORM_DEFAULT)

  function ouvrirCreation() {
    setDepenseAEditer(null)
    setForm(FORM_DEFAULT)
    setModalOuvert(true)
  }

  function ouvrirEdition(depense: Depense) {
    setDepenseAEditer(depense)
    setForm({
      categorie: depense.categorie,
      libelle: depense.libelle,
      montant: depense.montant,
      date_depense: depense.date_depense,
      notes: depense.notes || '',
    })
    setModalOuvert(true)
  }

  function fermerModal() {
    setModalOuvert(false)
    setDepenseAEditer(null)
    setForm(FORM_DEFAULT)
  }

  async function handleSubmit() {
    if (!form.libelle.trim() || !form.montant || !form.categorie) return

    const payload: DepenseFormData = {
      ...form,
      montant: Number(form.montant),
    }

    let ok = false
    if (depenseAEditer) {
      ok = await updateDepense(depenseAEditer.id, payload)
    } else {
      ok = await createDepense(payload)
    }

    if (ok) {
      fermerModal()
    }
  }

  async function handleSupprimer() {
    if (!depenseASupprimer) return
    await deleteDepense(depenseASupprimer.id)
    setDepenseASupprimer(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Depenses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Total periode :{' '}
            <span className="font-semibold text-red-600">
              {formatMontantAriary(totalDepenses)}
            </span>
          </p>
        </div>
        <Button onClick={ouvrirCreation} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une depense
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" />
          Filtres
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Categorie</Label>
            <Select
              value={filtres.categorie}
              onValueChange={(val) =>
                setFiltres({ ...filtres, categorie: val as 'TOUTES' | DepenseCategorie })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUTES">Toutes les categories</SelectItem>
                {DEPENSES_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Du</Label>
            <Input
              type="date"
              className="h-9"
              value={filtres.dateDebut}
              onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Au</Label>
            <Input
              type="date"
              className="h-9"
              value={filtres.dateFin}
              onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Liste desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : depenses.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingDown className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Aucune depense sur cette periode</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Libelle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categorie</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {depenses.map((depense) => (
                <tr key={depense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(depense.date_depense + 'T00:00:00').toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{depense.libelle}</p>
                    {depense.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{depense.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' +
                        getDepenseCategorieBadgeClass(depense.categorie)
                      }
                    >
                      {getDepenseCategorieLabel(depense.categorie)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                    {formatMontantAriary(depense.montant)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => ouvrirEdition(depense)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDepenseASupprimer(depense)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Liste mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : depenses.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingDown className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Aucune depense sur cette periode</p>
          </div>
        ) : (
          depenses.map((depense) => (
            <div
              key={depense.id}
              className="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{depense.libelle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(depense.date_depense + 'T00:00:00').toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className="font-bold text-red-600 whitespace-nowrap text-sm">
                  {formatMontantAriary(depense.montant)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={
                    'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' +
                    getDepenseCategorieBadgeClass(depense.categorie)
                  }
                >
                  {getDepenseCategorieLabel(depense.categorie)}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => ouvrirEdition(depense)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDepenseASupprimer(depense)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {depense.notes && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                  {depense.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal creation / edition */}
      <Dialog open={modalOuvert} onOpenChange={(open) => { if (!open) fermerModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {depenseAEditer ? 'Modifier la depense' : 'Ajouter une depense'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(val) =>
                  setForm({ ...form, categorie: val as DepenseCategorie })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPENSES_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Libelle</Label>
              <Input
                placeholder="Ex: Achat lait 200L"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Montant (Ar)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 50000"
                value={form.montant || ''}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date_depense}
                onChange={(e) => setForm({ ...form, date_depense: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Details supplementaires..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fermerModal} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.libelle.trim() || !form.montant}
            >
              {saving ? 'Enregistrement...' : depenseAEditer ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog
        open={!!depenseASupprimer}
        onOpenChange={(open) => { if (!open) setDepenseASupprimer(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette depense ?</AlertDialogTitle>
            <AlertDialogDescription>
              {depenseASupprimer?.libelle} —{' '}
              {depenseASupprimer ? formatMontantAriary(depenseASupprimer.montant) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSupprimer}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
    }
