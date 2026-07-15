'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { livreurSchema } from "@/lib/schemas";
import * as z from "zod";
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
import { Utilisateur } from "@/types";
import { useEffect } from "react";
import { useZones } from "@/hooks/useZones";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { Mail } from "lucide-react";

type LivreurFormValues = z.infer<typeof livreurSchema>;

interface LivreurFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LivreurFormValues) => Promise<void>;
  initialData?: Utilisateur | null;
}

export function LivreurFormModal({ open, onOpenChange, onSubmit, initialData }: LivreurFormModalProps) {
  const { zones } = useZones();

  const form = useForm<LivreurFormValues>({
    resolver: zodResolver(livreurSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      zone_id: null,
      actif: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom: initialData.nom,
        email: initialData.email || "",
        telephone: initialData.telephone || "",
        zone_id: initialData.zone_id,
        actif: initialData.actif,
      });
    } else {
      form.reset({
        nom: "",
        email: "",
        telephone: "",
        zone_id: null,
        actif: true,
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: LivreurFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch {
      // erreur geree par le parent
    }
  };

  const title = initialData ? "Modifier le livreur" : "Ajouter un livreur";

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Rakoto Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (obligatoire)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ex: rakoto@anjara.mg" {...field} value={field.value || ""} />
                </FormControl>
                {!initialData && (
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    Un email d&apos;invitation sera envoye
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone</FormLabel>
                  <FormControl>
                    <Input placeholder="034..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zone_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone assignee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                  <FormLabel>Compte actif</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {initialData ? "Mettre a jour" : "Creer et inviter"}
            </Button>
          </div>
        </form>
      </Form>
    </MobileSheet>
  );
}