'use client';

import { useState, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commandeCreateSchema, CommandeCreateValues } from "@/lib/schemas/commande.schema";
import { useClients } from "@/hooks/useClients";
import { useProduits } from "@/hooks/useProduits";
import { useCommandes } from "@/hooks/useCommandes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/DatePicker";
import { ParfumsCheckboxes } from "./ParfumsCheckboxes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, User, Info } from "lucide-react";
import { addDays, format } from "date-fns";

export function CommandeForm() {
  const router = useRouter();
  const { clients } = useClients();
  const { produits } = useProduits();
  const { createCommande } = useCommandes();
  const supabase = createClient();

  const [assignedLivreur, setAssignedLivreur] = useState<{ id: string, nom: string, zone: string } | null>(null);
  const [loadingLivreur, setLoadingLivreur] = useState(false);

  const form = useForm<CommandeCreateValues>({
    resolver: zodResolver(commandeCreateSchema),
    defaultValues: {
      client_id: "",
      date_livraison: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      total_yaourt_commande: 0,
      total_jus_commande: 0,
      parfums_yaourt_souhaites: "",
      parfums_jus_souhaites: "",
      commentaire: "",
    },
  });

  const selectedClientId = form.watch("client_id");

  // Fetch livreur when client changes
  useMemo(() => {
    async function fetchLivreur() {
        if (!selectedClientId) {
          setAssignedLivreur(null);
          return;
        }

        setLoadingLivreur(true);
        const client = clients.find(c => c.id === selectedClientId);
        if (client?.zone_id) {
          const { data } = await supabase
            .from('utilisateurs')
            .select('id, nom, zone:zones(nom)')
            .eq('zone_id', client.zone_id)
            .eq('role', 'LIVREUR')
            .eq('actif', true)
            .eq('is_archived', false)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (data) {
            const zoneName = (data.zone as unknown as { nom: string } | null)?.nom || "Inconnue";
            setAssignedLivreur({
              id: data.id,
              nom: data.nom,
              zone: zoneName
            });
          } else {
            setAssignedLivreur(null);
          }
        } else {
          setAssignedLivreur(null);
        }
        setLoadingLivreur(false);
    }
    fetchLivreur();
  }, [selectedClientId, clients, supabase]);

  const onSubmit = async (values: CommandeCreateValues) => {
    try {
      const result = await createCommande(values);
      toast.success("Commande créée avec succès");
      if (result) {
          router.push(`/commandes/${result.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("Erreur lors de la création", { description: message });
    }
  };

  const produitsYaourt = produits.filter(p => p.categorie === 'YAOURT' && p.actif);
  const produitsJus = produits.filter(p => p.categorie === 'JUS' && p.actif);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Client & Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-500" /> Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Point de Vente)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nom_pdv} ({c.code_client})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_livraison"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de livraison prévue</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : "")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Livreur */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900">Livreur assigné</p>
                    {loadingLivreur ? (
                      <p className="text-xs text-blue-700 italic">Recherche du livreur...</p>
                    ) : assignedLivreur ? (
                      <p className="text-xs text-blue-700">
                        {assignedLivreur.nom} (Secteur: {assignedLivreur.zone})
                      </p>
                    ) : selectedClientId ? (
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                        <Info className="h-3 w-3" /> Aucun livreur actif sur cette zone
                      </p>
                    ) : (
                      <p className="text-xs text-blue-600 italic">Sélectionnez un client pour voir le livreur</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Commentaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-gray-500" /> Notes complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions ou remarques</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Appeler avant de passer, client absent entre 12h et 14h..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Section Produits */}
        <div className="space-y-6">
          {/* YAOURT */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Section Yaourts</CardTitle>
                <FormField
                  control={form.control}
                  name="total_yaourt_commande"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormLabel className="font-bold whitespace-nowrap">Total demandé :</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="w-24 text-right font-bold text-blue-600 border-blue-200 focus:ring-blue-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="parfums_yaourt_souhaites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Parfums souhaités (indicatif)</FormLabel>
                    <FormControl>
                      <ParfumsCheckboxes
                        produits={produitsYaourt}
                        selectedParfums={field.value ? field.value.split(', ') : []}
                        onChange={(parfums) => field.onChange(parfums.join(', '))}
                        disabled={form.watch("total_yaourt_commande") === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* JUS */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Section Jus</CardTitle>
                <FormField
                  control={form.control}
                  name="total_jus_commande"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormLabel className="font-bold whitespace-nowrap">Total demandé :</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="w-24 text-right font-bold text-orange-600 border-orange-200 focus:ring-orange-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="parfums_jus_souhaites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Parfums souhaités (indicatif)</FormLabel>
                    <FormControl>
                      <ParfumsCheckboxes
                        produits={produitsJus}
                        selectedParfums={field.value ? field.value.split(', ') : []}
                        onChange={(parfums) => field.onChange(parfums.join(', '))}
                        disabled={form.watch("total_jus_commande") === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" size="lg" className="px-8" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Création..." : "Enregistrer la commande"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
