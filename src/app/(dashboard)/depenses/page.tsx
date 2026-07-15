'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useDepenses, DEPENSES_CATEGORIES, getDepenseCategorieLabel, getDepenseCategorieBadgeClass, formatMontantAriary, type Depense, type DepenseFormData, type DepenseCategorie } from '@/hooks/useDepenses'
import { Plus, Pencil, Trash2, TrendingDown, Filter, Settings } from 'lucide-react'
import { toast } from 'sonner'

type MatierePremiere = { id: string; nom: string; unite: string }
type MatiereForm = { nom: string; unite: string }
type DepenseExtended = Depense & { quantite?: number; prix_unitaire?: number; matiere_id?: string; matieres_premieres?: { nom: string; unite: string } }
type DepenseFormExtended = DepenseFormData & { quantite: string; prix_unitaire: string; matiere_id: string; dernierChampModifie: 'prix_unitaire' | 'montant' }

const UNITES = ['kg', 'litre', 'piece', 'sachet', 'boite', 'carton', 'gramme', 'ml']
const FORM_DEFAULT: DepenseFormExtended = { categorie: 'AUTRES', libelle: '', montant: 0, date_depense: new Date().toISOString().split('T')[0], notes: '', quantite: '', prix_unitaire: '', matiere_id: '', dernierChampModifie: 'montant' }
export default function DepensesPage() {
  const { depenses, filtres, setFiltres, loading, saving, totalDepenses, createDepense, updateDepense, deleteDepense } = useDepenses()
  const [role, setRole] = useState<string>('ADMIN')
  const [modalOuvert, setModalOuvert] = useState(false)
  const [depenseAEditer, setDepenseAEditer] = useState<Depense | null>(null)
  const [depenseASupprimer, setDepenseASupprimer] = useState<Depense | null>(null)
  const [form, setForm] = useState<DepenseFormExtended>(FORM_DEFAULT)
  const [matieres, setMatieres] = useState<MatierePremiere[]>([])
  const [modalMatieres, setModalMatieres] = useState(false)
  const [matiereForm, setMatiereForm] = useState<MatiereForm>({ nom: '', unite: 'kg' })
  const [savingMatiere, setSavingMatiere] = useState(false)
  const [matiereASupprimer, setMatiereASupprimer] = useState<MatierePremiere | null>(null)
  const chargerMatieres = useCallback(async () => { try { const res = await fetch('/api/matieres-premieres'); const json = await res.json(); setMatieres(Array.isArray(json.data) ? json.data : []) } catch { setMatieres([]) } }, [])
  const chargerRole = useCallback(async () => { try { const res = await fetch('/api/depenses'); const json = await res.json(); if (json.role) setRole(json.role) } catch {} }, [])
  useEffect(() => { void chargerMatieres(); void chargerRole() }, [chargerMatieres, chargerRole])
  function isToday(dateStr: string): boolean { return dateStr === new Date().toISOString().split('T')[0] }
  function peutModifier(depense: Depense): boolean { if (role === 'ADMIN') return true; return isToday(depense.date_depense) }
  function ouvrirCreation() { setDepenseAEditer(null); setForm(FORM_DEFAULT); setModalOuvert(true) }
  function ouvrirEdition(depense: Depense) { const d = depense as DepenseExtended; setDepenseAEditer(depense); setForm({ categorie: depense.categorie, libelle: depense.libelle || '', montant: depense.montant, date_depense: depense.date_depense, notes: depense.notes || '', quantite: d.quantite ? String(d.quantite) : '', prix_unitaire: d.prix_unitaire ? String(d.prix_unitaire) : '', matiere_id: d.matiere_id || '', dernierChampModifie: 'montant' }); setModalOuvert(true) }
  function fermerModal() { setModalOuvert(false); setDepenseAEditer(null); setForm(FORM_DEFAULT) }
  function handleQuantiteChange(val: string) { const qte = Number(val); const nf = { ...form, quantite: val }; if (form.dernierChampModifie === 'prix_unitaire' && form.prix_unitaire && qte > 0) { nf.montant = qte * Number(form.prix_unitaire) } else if (form.dernierChampModifie === 'montant' && form.montant && qte > 0) { nf.prix_unitaire = String(Math.round(form.montant / qte)) } setForm(nf) }
  function handlePrixUnitaireChange(val: string) { const prix = Number(val); const nf: DepenseFormExtended = { ...form, prix_unitaire: val, dernierChampModifie: 'prix_unitaire' }; if (form.quantite && prix > 0) { nf.montant = Number(form.quantite) * prix } setForm(nf) }
  function handleMontantChange(val: string) { const montant = Number(val); const nf: DepenseFormExtended = { ...form, montant, dernierChampModifie: 'montant' }; if (form.quantite && montant > 0 && Number(form.quantite) > 0) { nf.prix_unitaire = String(Math.round(montant / Number(form.quantite))) } setForm(nf) }
  async function handleSubmit() {
    if (!form.montant || !form.categorie) return
    if (form.categorie === 'MATIERES_PREMIERES' && !form.matiere_id) { toast.error('Choisir une matiere premiere'); return }
    if (form.categorie !== 'MATIERES_PREMIERES' && !form.libelle.trim()) { toast.error('Libelle requis'); return }
    const payload = { categorie: form.categorie, libelle: form.libelle || null, montant: Number(form.montant), date_depense: form.date_depense, notes: form.notes, quantite: form.quantite ? Number(form.quantite) : null, prix_unitaire: form.prix_unitaire ? Number(form.prix_unitaire) : null, matiere_id: form.matiere_id || null }
    let ok = false
    if (depenseAEditer) { ok = await updateDepense(depenseAEditer.id, payload as DepenseFormData) } else { ok = await createDepense(payload as DepenseFormData) }
    if (ok) fermerModal()
  }
  async function handleSupprimer() { if (!depenseASupprimer) return; await deleteDepense(depenseASupprimer.id); setDepenseASupprimer(null) }
  async function handleSaveMatiere() { if (!matiereForm.nom.trim()) return; setSavingMatiere(true); try { const res = await fetch('/api/matieres-premieres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(matiereForm) }); if (!res.ok) throw new Error('Erreur'); toast.success('Matiere ajoutee'); setMatiereForm({ nom: '', unite: 'kg' }); await chargerMatieres() } catch { toast.error('Erreur ajout matiere') } finally { setSavingMatiere(false) } }
  async function handleSupprimerMatiere() { if (!matiereASupprimer) return; try { const res = await fetch('/api/matieres-premieres?id=' + matiereASupprimer.id, { method: 'DELETE' }); if (!res.ok) throw new Error('Erreur'); toast.success('Matiere supprimee'); setMatiereASupprimer(null); await chargerMatieres() } catch { toast.error('Erreur suppression') } }
  const matiereSelectionnee = matieres.find((m) => m.id === form.matiere_id)
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Depenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total periode : <span className="font-semibold text-red-600">{formatMontantAriary(totalDepenses)}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalMatieres(true)} className="flex-1 md:flex-none"><Settings className="h-4 w-4 mr-2" />Matieres</Button>
          <Button onClick={ouvrirCreation} className="flex-1 md:flex-none"><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Filter className="h-4 w-4" />Filtres</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs text-gray-500">Categorie</Label><Select value={filtres.categorie} onValueChange={(val) => setFiltres({ ...filtres, categorie: val as 'TOUTES' | DepenseCategorie })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUTES">Toutes les categories</SelectItem>{DEPENSES_CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs text-gray-500">Du</Label><Input type="date" className="h-9" value={filtres.dateDebut} onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs text-gray-500">Au</Label><Input type="date" className="h-9" value={filtres.dateFin} onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })} /></div>
        </div>
      </div>
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (<div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>) : depenses.length === 0 ? (<div className="p-8 text-center"><TrendingDown className="h-10 w-10 mx-auto text-gray-300 mb-3" /><p className="text-gray-400 text-sm">Aucune depense sur cette periode</p></div>) : (
          <table className="w-full text-sm"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 font-medium text-gray-600">Date</th><th className="text-left px-4 py-3 font-medium text-gray-600">Libelle</th><th className="text-left px-4 py-3 font-medium text-gray-600">Categorie</th><th className="text-right px-4 py-3 font-medium text-gray-600">Qte</th><th className="text-right px-4 py-3 font-medium text-gray-600">Prix unit.</th><th className="text-right px-4 py-3 font-medium text-gray-600">Montant</th><th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{depenses.map((depense) => { const d = depense as DepenseExtended; const autorise = peutModifier(depense); return (
            <tr key={depense.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(depense.date_depense + 'T00:00:00').toLocaleDateString('fr-FR')}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900">{d.matieres_premieres ? d.matieres_premieres.nom : depense.libelle}</p>{depense.notes && <p className="text-xs text-gray-400 mt-0.5">{depense.notes}</p>}</td>
              <td className="px-4 py-3"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + getDepenseCategorieBadgeClass(depense.categorie)}>{getDepenseCategorieLabel(depense.categorie)}</span></td>
              <td className="px-4 py-3 text-right text-gray-600">{d.quantite ? String(d.quantite) + (d.matieres_premieres ? ' ' + d.matieres_premieres.unite : '') : '-'}</td>
              <td className="px-4 py-3 text-right text-gray-600">{d.prix_unitaire ? formatMontantAriary(d.prix_unitaire) : '-'}</td>
              <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">{formatMontantAriary(depense.montant)}</td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => ouvrirEdition(depense)} disabled={!autorise}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDepenseASupprimer(depense)} disabled={!autorise}><Trash2 className="h-3.5 w-3.5" /></Button></div></td>
            </tr>) })}</tbody></table>)}
      </div>
      <div className="md:hidden space-y-3">
        {loading ? (<div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>) : depenses.length === 0 ? (<div className="p-8 text-center"><TrendingDown className="h-10 w-10 mx-auto text-gray-300 mb-3" /><p className="text-gray-400 text-sm">Aucune depense sur cette periode</p></div>) : depenses.map((depense) => { const d = depense as DepenseExtended; const autorise = peutModifier(depense); return (
          <div key={depense.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{d.matieres_premieres ? d.matieres_premieres.nom : depense.libelle}</p><p className="text-xs text-gray-400 mt-0.5">{new Date(depense.date_depense + 'T00:00:00').toLocaleDateString('fr-FR')}</p></div><p className="font-bold text-red-600 whitespace-nowrap text-sm">{formatMontantAriary(depense.montant)}</p></div>
            {(d.quantite || d.prix_unitaire) && (<div className="flex gap-4 text-xs text-gray-500">{d.quantite && <span>Qte : {d.quantite} {d.matieres_premieres ? d.matieres_premieres.unite : ''}</span>}{d.prix_unitaire && <span>Prix unit. : {formatMontantAriary(d.prix_unitaire)}</span>}</div>)}
            <div className="flex items-center justify-between"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + getDepenseCategorieBadgeClass(depense.categorie)}>{getDepenseCategorieLabel(depense.categorie)}</span><div className="flex items-center gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => ouvrirEdition(depense)} disabled={!autorise}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDepenseASupprimer(depense)} disabled={!autorise}><Trash2 className="h-3.5 w-3.5" /></Button></div></div>
            {depense.notes && <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">{depense.notes}</p>}
          </div>) })}
      </div>
      <Dialog open={modalOuvert} onOpenChange={(open) => { if (!open) fermerModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{depenseAEditer ? 'Modifier la depense' : 'Ajouter une depense'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Categorie</Label><Select value={form.categorie} onValueChange={(val) => setForm({ ...form, categorie: val as DepenseCategorie, libelle: '', matiere_id: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEPENSES_CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent></Select></div>
            {form.categorie === 'MATIERES_PREMIERES' ? (
              <div className="space-y-1.5"><Label>Matiere premiere</Label>{matieres.length === 0 ? (<p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Aucune matiere configuree. Clique sur &quot;Matieres&quot; pour en ajouter.</p>) : (<Select value={form.matiere_id} onValueChange={(val) => setForm({ ...form, matiere_id: val })}><SelectTrigger><SelectValue placeholder="Choisir une matiere..." /></SelectTrigger><SelectContent>{matieres.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nom} ({m.unite})</SelectItem>))}</SelectContent></Select>)}</div>
            ) : (
              <div className="space-y-1.5"><Label>Libelle</Label><Input placeholder="Ex: Salaire Jean, Loyer bureau..." value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Quantite {matiereSelectionnee ? '(' + matiereSelectionnee.unite + ')' : ''}</Label><Input type="number" min="0" placeholder="Ex: 200" value={form.quantite} onChange={(e) => handleQuantiteChange(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Prix unitaire (Ar)</Label><Input type="number" min="0" placeholder="Auto" value={form.prix_unitaire} onChange={(e) => handlePrixUnitaireChange(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Montant total (Ar)</Label><Input type="number" min="1" placeholder="Ex: 50000" value={form.montant || ''} onChange={(e) => handleMontantChange(e.target.value)} />{form.quantite && form.prix_unitaire && (<p className="text-xs text-emerald-600">{form.quantite} x {formatMontantAriary(Number(form.prix_unitaire))} = {formatMontantAriary(Number(form.quantite) * Number(form.prix_unitaire))}</p>)}</div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date_depense} onChange={(e) => setForm({ ...form, date_depense: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Notes (optionnel)</Label><Textarea placeholder="Details supplementaires..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={fermerModal} disabled={saving}>Annuler</Button><Button onClick={handleSubmit} disabled={saving || !form.montant}>{saving ? 'Enregistrement...' : depenseAEditer ? 'Modifier' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!depenseASupprimer} onOpenChange={(open) => { if (!open) setDepenseASupprimer(null) }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette depense ?</AlertDialogTitle><AlertDialogDescription>{(depenseASupprimer?.libelle || '') + (depenseASupprimer ? ' -- ' + formatMontantAriary(depenseASupprimer.montant) : '')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleSupprimer}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <Dialog open={modalMatieres} onOpenChange={(open) => { if (!open) setModalMatieres(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Gestion matieres premieres</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nom</Label><Input placeholder="Ex: Lait, Sucre..." value={matiereForm.nom} onChange={(e) => setMatiereForm({ ...matiereForm, nom: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Unite</Label><Select value={matiereForm.unite} onValueChange={(val) => setMatiereForm({ ...matiereForm, unite: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNITES.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <Button onClick={handleSaveMatiere} disabled={savingMatiere || !matiereForm.nom.trim()} className="w-full"><Plus className="h-4 w-4 mr-2" />{savingMatiere ? 'Ajout...' : 'Ajouter cette matiere'}</Button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {matieres.length === 0 ? (<p className="text-sm text-gray-400 text-center py-4">Aucune matiere configuree</p>) : matieres.map((m) => (<div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div><p className="text-sm font-medium text-gray-900">{m.nom}</p><p className="text-xs text-gray-400">{m.unite}</p></div><button onClick={() => setMatiereASupprimer(m)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button></div>))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalMatieres(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!matiereASupprimer} onOpenChange={(open) => { if (!open) setMatiereASupprimer(null) }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette matiere ?</AlertDialogTitle><AlertDialogDescription>{matiereASupprimer?.nom || ''}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleSupprimerMatiere}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  )
}