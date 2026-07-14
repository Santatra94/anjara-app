'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zoneSchema } from "@/lib/schemas";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zone } from "@/types";
import { useEffect } from "react";
import { MobileSheet } from "@/components/ui/mobile-sheet";

interface ZoneFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof zoneSchema>) => Promise<void>;
  initialData?: Zone | null;
}

export function ZoneFormModal({ open, onOpenChange, onSubmit, initialData }: ZoneFormModalProps) {
  const form = useForm<z.infer<typeof zoneSchema>>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      nom: "",
      ville: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom: initialData.nom,
        ville: initialData.ville || "",
      });
    } else {
      form.reset({
        nom: "",
        ville: "",
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: z.infer<typeof zoneSchema>) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch {
      // erreur geree par le parent
    }
  };

  const title = initialData ? "Modifier la zone" : "Ajouter une zone";

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la zone</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Centre Ville" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ville"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville (optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Antananarivo" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {initialData ? "Mettre a jour" : "Creer"}
            </Button>
          </div>
        </form>
      </Form>
    </MobileSheet>
  );
}