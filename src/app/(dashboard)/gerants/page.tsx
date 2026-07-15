'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Trash2, Building2, Mail, Phone, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

type SocieteData = { nom: string }

type GerantData = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  actif: boolean
  created_at: string
  societe_id: string
  societes: SocieteData | SocieteData[] | null
}

type FormData = {
  nom_societe: string
  nom_gerant: string
  email: string
  telephone: string
}

const FORM_DEFAULT: FormData = {
  nom_societe: '',
  nom_gerant: '',
  email: '',
  telephone: '',
}

function extractSocieteNom(soc: SocieteData | SocieteData[] | null): string {
  if (!soc) return 'Sans societe'
  if (Array.isArray(soc)) return soc[0]?.nom || 'Sans societe'
  return soc.nom || 'Sans societe'
}

export default function GerantsPage() {
  const [gerants, setGerants] = useState<GerantData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [form, setForm] = useState<FormData>(FORM_DEFAULT)
  const [gerantASupprimer, setGerantASupprimer] = useState<GerantData | null>(null)
  const [gerantAReset, setGerantAReset] = useState<GerantData | null>(null)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gerants')
      const json = await res.json()
      setGerants(Array.isArray(json.data) ? json.data : [])
    } catch {
      setGerants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  function ouvrirCreation() {
    setForm(FORM_DEFAULT)
    setModalOuvert(true)
  }

  async function handleSubmit() {
    if (!form.nom_societe.trim() || !form.nom_gerant.trim() || !form.email.trim()) {
      toast.error('Champs obligatoires manquants')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/gerants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Erreur')
      }
      toast.success(json.message || 'GERANT cree et email envoye')
      setModalOuvert(false)
      setForm(FORM_DEFAULT)
      await charger()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur creation'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleSupprimer() {
    if (!gerantASupprimer) return
    try {
      const res = await fetch('/api/gerants?id=' + gerantASupprimer.id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      toast.success('GERANT supprime')
      setGerantASupprimer(null)
      await charger()
    } catch {
      toast.error('Erreur suppression')
    }
  }

  async function handleReset() {
    if (!gerantAReset) return
    try {
      const res = await fetch('/api/gerants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', id: gerantAReset.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success(json.message || 'Email de reinitialisation envoye')
      setGerantAReset(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur reset'
      toast.error(msg)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerants (Business)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {gerants.length} business gere{gerants.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={ouvrirCreation} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau business
        </Button>
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : gerants.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Aucun gerant cree</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Gerant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Telephone</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gerants.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{extractSocieteNom(g.societes)}</td>
                  <td className="px-4 py-3 text-gray-700">{g.nom}</td>
                  <td className="px-4 py-3">
                    {g.email ? (
                      <a href={'mailto:' + g.email} className="text-blue-600 hover:underline">
                        {g.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {g.telephone ? (
                      <a href={'tel:' + g.telephone} className="text-blue-600 hover:underline">
                        {g.telephone}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => setGerantAReset(g)}
                        disabled={!g.email}
                        title="Reinitialiser mot de passe"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setGerantASupprimer(g)}
                        title="Supprimer"
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

      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : gerants.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Aucun gerant cree</p>
          </div>
        ) : (
          gerants.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{extractSocieteNom(g.societes)}</p>
                    <p className="text-xs text-gray-500 truncate">{g.nom}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 border-t border-gray-100 pt-2">
                {g.email && (
                  <a href={'mailto:' + g.email} className="flex items-center gap-2 text-xs text-blue-600">
                    <Mail className="h-3 w-3" />
                    {g.email}
                  </a>
                )}
                {g.telephone && (
                  <a href={'tel:' + g.telephone} className="flex items-center gap-2 text-xs text-blue-600">
                    <Phone className="h-3 w-3" />
                    {g.telephone}
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGerantAReset(g)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  disabled={!g.email}
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  Reset MDP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGerantASupprimer(g)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOuvert} onOpenChange={(open) => { if (!open) setModalOuvert(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau business + gerant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom du business</Label>
              <Input
                placeholder="Ex: Yaourts Antsirabe SARL"
                value={form.nom_societe}
                onChange={(e) => setForm({ ...form, nom_societe: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nom du gerant</Label>
              <Input
                placeholder="Ex: Rakoto Jean"
                value={form.nom_gerant}
                onChange={(e) => setForm({ ...form, nom_gerant: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="jean@example.mg"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-xs text-gray-400">Un email d&apos;invitation sera envoye</p>
            </div>
            <div className="space-y-1.5">
              <Label>Telephone (optionnel)</Label>
              <Input
                placeholder="+261 34 12 345 67"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOuvert(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.nom_societe.trim() || !form.nom_gerant.trim() || !form.email.trim()}
            >
              {saving ? 'Creation...' : 'Creer et inviter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!gerantASupprimer} onOpenChange={(open) => { if (!open) setGerantASupprimer(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce gerant ?</AlertDialogTitle>
            <AlertDialogDescription>
              {gerantASupprimer?.nom || ''} - {gerantASupprimer ? extractSocieteNom(gerantASupprimer.societes) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleSupprimer}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!gerantAReset} onOpenChange={(open) => { if (!open) setGerantAReset(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reinitialiser le mot de passe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un email sera envoye a &quot;{gerantAReset?.email}&quot; pour permettre a {gerantAReset?.nom} de definir un nouveau mot de passe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={handleReset}>
              Envoyer l&apos;email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}