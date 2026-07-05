'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produitSchema } from "@/lib/schemas";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Produit } from "@/types";
import { useEffect } from "react";

type ProduitFormValues = z.infer<typeof produitSchema>;

interface ProduitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProduitFormValues) => Promise<void>;
  initialData?: Produit | null;
}

export function ProduitFormModal({ open, onOpenChange, onSubmit, initialData }: ProduitFormModalProps) {
  const form = useForm<ProduitFormValues>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      nom_produit: "",
      categorie: "YAOURT",
      prix: 0,
      prix_achat: 0,
      stock_min: 0,
      saison: "",
      actif: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom_produit: initialData.nom_produit,
        categorie: initialData.categorie,
        prix: initialData.prix,
        prix_achat: initialData.prix_achat || 0,
        stock_min: initialData.stock_min,
        saison: initialData.saison || "",
        actif: initialData.actif,
      });
    } else {
      form.reset({
        nom_produit: "",
        categorie: "YAOURT",
        prix: 0,
        prix_achat: 0,
        stock_min: 0,
        saison: "",
        actif: true,
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: ProduitFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom_produit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Yaourt Nature 125g" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YAOURT">Yaourt</SelectItem>
                        <SelectItem value="JUS">Jus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saison (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Été" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente (Ar)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prix_achat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix d&apos;achat (Ar)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock_min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alerte stock faible (quantité)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Produit actif</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Désactiver pour ne plus le proposer dans les commandes.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {initialData ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
