'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCommandeDetail, CommandeFull } from "@/hooks/useCommandeDetail";
import { useLignesCommande } from "@/hooks/useLignesCommande";
import { useCommandes } from "@/hooks/useCommandes";
import { useProduits } from "@/hooks/useProduits";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Truck,
  ShoppingCart,
  Clock,
  AlertCircle,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ProduitLocal = {
  id: string;
  nom_produit: string;
  prix: number;
  categorie: "YAOURT" | "JUS";
  actif: boolean;
};

type SuggestionState = {
  nomOriginal: string;
  produitIdSelectionne: string;
  quantite: number;
};

function parseParfums(texte: string | null | undefined): string[] {
  if (!texte) return [];
  return texte.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
}

function trouverProduit(nomParfum: string, produits: ProduitLocal[]): ProduitLocal | null {
  const nomLower = nomParfum.toLowerCase();
  const trouve = produits.find(function (p) {
    return p.nom_produit.toLowerCase() === nomLower;
  });
  return trouve || null;
}

export function PreparationInterface({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const { commande, loading: loadingCmd, refresh: refreshCmd } = useCommandeDetail(id);
  const { lignes, loading: loadingLignes, addLigne, removeLigne } = useLignesCommande(id);
  const { produits } = useProduits();
  const { updateStatut } = useCommandes();

  const [selectedProduitId, setSelectedProduitId] = useState<string>("");
  const [quantite, setQuantite] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [suggestionStates, setSuggestionStates] = useState<SuggestionState[]>([]);

  const selectedProduit = useMemo(function () {
    return produits.find(function (p) { return p.id === selectedProduitId; });
  }, [selectedProduitId, produits]);

  const parfumsCommande = useMemo(function () {
    if (!commande) return [] as string[];
    const parfumsYaourt = parseParfums(commande.parfums_yaourt_souhaites);
    const parfumsJus = parseParfums(commande.parfums_jus_souhaites);
    return parfumsYaourt.concat(parfumsJus);
  }, [commande]);

  useEffect(function () {
    if (parfumsCommande.length === 0 || produits.length === 0) return;
    if (suggestionStates.length > 0) return;

    const initStates = parfumsCommande.map(function (nom) {
      const match = trouverProduit(nom, produits as ProduitLocal[]);
      return {
        nomOriginal: nom,
        produitIdSelectionne: match ? match.id : '',
        quantite: 0,
      };
    });
    setSuggestionStates(initStates);
  }, [parfumsCommande, produits, suggestionStates.length]);

  if (loadingCmd || loadingLignes) return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-blue-500" /></div>;
  if (!commande) return <div className="text-center py-12 text-red-500 font-bold">Commande introuvable</div>;

  function updateSuggestionProduit(index: number, newProduitId: string) {
    const newStates = suggestionStates.map(function (s, i) {
      if (i === index) {
        return { nomOriginal: s.nomOriginal, produitIdSelectionne: newProduitId, quantite: s.quantite };
      }
      return s;
    });
    setSuggestionStates(newStates);
  }

  function updateSuggestionQuantite(index: number, newQte: number) {
    const newStates = suggestionStates.map(function (s, i) {
      if (i === index) {
        return { nomOriginal: s.nomOriginal, produitIdSelectionne: s.produitIdSelectionne, quantite: newQte };
      }
      return s;
    });
    setSuggestionStates(newStates);
  }

  const handleAddSuggestion = async function (index: number) {
    const sugg = suggestionStates[index];
    if (!sugg || !sugg.produitIdSelectionne) {
      toast.error("Selectionner un produit");
      return;
    }
    if (sugg.quantite <= 0) {
      toast.error("Saisir une quantite superieure a 0");
      return;
    }

    const produitChoisi = produits.find(function (p) { return p.id === sugg.produitIdSelectionne; });
    if (!produitChoisi) {
      toast.error("Produit introuvable");
      return;
    }

    setSubmitting(true);
    const result = await addLigne({
      produit_id: produitChoisi.id,
      quantite: sugg.quantite,
      prix_unitaire: produitChoisi.prix,
      categorie: produitChoisi.categorie as "YAOURT" | "JUS",
    });

    if (result.success) {
      toast.success(produitChoisi.nom_produit + " ajoute");
      updateSuggestionQuantite(index, 0);
      await refreshCmd();
    }
    setSubmitting(false);
  };

  const handleAddLigne = async function () {
    if (!selectedProduit) {
      toast.error("Veuillez selectionner un produit");
      return;
    }
    if (quantite <= 0) {
      toast.error("La quantite doit etre superieure a 0");
      return;
    }

    setSubmitting(true);
    const result = await addLigne({
      produit_id: selectedProduit.id,
      quantite,
      prix_unitaire: selectedProduit.prix,
      categorie: selectedProduit.categorie,
    });

    if (result.success) {
      toast.success("Produit ajoute a la preparation");
      setSelectedProduitId("");
      setQuantite(1);
      await refreshCmd();
    }
    setSubmitting(false);
  };

  const handleFinishPreparation = async function () {
    try {
      if (!commande || !user) return;

      const insertResult = await supabase.from('preparations_commande').insert([{
        commande_id: id,
        livreur_id: (commande as CommandeFull).livreur_assigne_id,
        societe_id: user.societe.id,
        statut_prepa: 'TERMINEE'
      }]);
      if (insertResult.error) throw insertResult.error;

      await updateStatut(id, 'PREPARATION');
      toast.success("Preparation terminee avec succes");
      router.push('/commandes/' + id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur lors de la validation", { description: message });
    }
  };

  const handlePassToDelivery = async function () {
    try {
      await updateStatut(id, 'EN_LIVRAISON');
      toast.success("Commande passee en livraison");
      router.push('/commandes/' + id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur lors du passage en livraison", { description: message });
    }
  };

  function getProgressColor(percent: number): string {
    if (percent >= 81) return "bg-green-500";
    if (percent >= 41) return "bg-orange-500";
    return "bg-red-500";
  }

  const yaourtPercent = (commande.total_yaourt_commande ?? 0) > 0
    ? Math.min(100, Math.round(((commande.total_yaourt ?? 0) / (commande.total_yaourt_commande ?? 0)) * 100))
    : 0;

  const jusPercent = (commande.total_jus_commande ?? 0) > 0
    ? Math.min(100, Math.round(((commande.total_jus ?? 0) / (commande.total_jus_commande ?? 0)) * 100))
    : 0;

  function getPrixProduitSelectionne(produitId: string): string {
    const p = produits.find(function (pr) { return pr.id === produitId; });
    if (p) return p.prix.toLocaleString() + ' Ar';
    return '—';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={'/commandes/' + id}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preparation : {commande.code_commande}</h1>
          <p className="text-muted-foreground text-sm">Saisie du contenu reel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gray-50 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-gray-500">Rappel de la demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-bold">{commande.client?.nom_pdv}</p>
                <p className="text-sm text-gray-600">{commande.client?.zone?.nom}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-blue-700">Yaourts demandes :</span>
                    <span className="font-bold">{commande.total_yaourt_commande}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">Parfums : {commande.parfums_yaourt_souhaites || "—"}</p>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden border">
                    <div
                      className={'h-full transition-all duration-500 ' + getProgressColor(yaourtPercent)}
                      style={{ width: yaourtPercent + '%' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-orange-700">Jus demandes :</span>
                    <span className="font-bold">{commande.total_jus_commande}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">Parfums : {commande.parfums_jus_souhaites || "—"}</p>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden border">
                    <div
                      className={'h-full transition-all duration-500 ' + getProgressColor(jusPercent)}
                      style={{ width: jusPercent + '%' }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(commande.total_yaourt ?? 0) < (commande.total_yaourt_commande ?? 0) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-xs">Attention : la preparation des yaourts est incomplete par rapport a la demande.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">

          {suggestionStates.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Suggestions basees sur la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestionStates.map(function (sugg, idx) {
                  return (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="flex-1 min-w-[180px] space-y-1">
                        <p className="text-xs text-gray-400">Demande : {sugg.nomOriginal}</p>
                        <Select
                          value={sugg.produitIdSelectionne}
                          onValueChange={function (v) { updateSuggestionProduit(idx, v); }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Choisir un produit" />
                          </SelectTrigger>
                          <SelectContent>
                            {produits.filter(function (p) { return p.actif; }).map(function (p) {
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nom_produit}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-20 space-y-1">
                        <p className="text-xs text-gray-400">Qte</p>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="h-9"
                          value={sugg.quantite || ''}
                          onChange={function (e) { updateSuggestionQuantite(idx, parseInt(e.target.value) || 0); }}
                        />
                      </div>

                      <div className="w-20 space-y-1">
                        <p className="text-xs text-gray-400">Prix</p>
                        <div className="h-9 px-2 flex items-center bg-gray-50 border rounded-md text-xs font-medium">
                          {getPrixProduitSelectionne(sugg.produitIdSelectionne)}
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={function () { handleAddSuggestion(idx); }}
                          disabled={submitting || !sugg.produitIdSelectionne || sugg.quantite <= 0}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Ajouter
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Autre produit (libre)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Produit</label>
                  <Select onValueChange={function (v) { setSelectedProduitId(v || ""); }} value={selectedProduitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.filter(function (p) { return p.actif; }).map(function (p) {
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom_produit} ({p.prix.toLocaleString()} Ar)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Qte</label>
                  <Input
                    type="number"
                    min={1}
                    value={quantite}
                    onChange={function (e) { setQuantite(parseInt(e.target.value) || 0); }}
                  />
                </div>

                <div className="w-32 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Prix Unitaire</label>
                  <div className="h-10 px-3 flex items-center bg-gray-50 border rounded-md text-sm font-medium">
                    {selectedProduit ? selectedProduit.prix.toLocaleString() + ' Ar' : "—"}
                  </div>
                </div>

                <Button
                  onClick={handleAddLigne}
                  disabled={submitting || !selectedProduitId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contenu de la caisse</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantite</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                        La caisse est vide.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lignes.map(function (ligne) {
                      return (
                        <TableRow key={ligne.id}>
                          <TableCell className="font-medium">{ligne.produit?.nom_produit}</TableCell>
                          <TableCell className="text-right font-bold">{ligne.quantite}</TableCell>
                          <TableCell className="text-right">
                            {((ligne.quantite || 0) * (ligne.prix_unitaire || 0)).toLocaleString()} Ar
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async function () {
                                await removeLigne(ligne.id);
                                await refreshCmd();
                                toast.info("Produit retire");
                              }}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {lignes.length > 0 && (
                    <TableRow className="bg-blue-50/50 font-bold border-t-2">
                      <TableCell className="uppercase text-xs tracking-wider">Total Prepare</TableCell>
                      <TableCell className="text-right">{lignes.reduce(function (acc, curr) { return acc + (curr.quantite || 0); }, 0)}</TableCell>
                      <TableCell className="text-right text-blue-700">
                        {lignes.reduce(function (acc, curr) { return acc + ((curr.quantite || 0) * (curr.prix_unitaire || 0)); }, 0).toLocaleString()} Ar
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShoppingCart className="h-4 w-4" />
              <span>Une fois la preparation terminee, la commande pourra passer en livraison.</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleFinishPreparation} disabled={lignes.length === 0}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Terminer la preparation
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handlePassToDelivery} disabled={lignes.length === 0}>
                <Truck className="mr-2 h-4 w-4" /> Passer directement en livraison
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
