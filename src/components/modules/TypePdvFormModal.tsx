'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { typePdvSchema } from "@/lib/schemas";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TypePdv } from "@/types";
import { useEffect } from "react";

interface TypePdvFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof typePdvSchema>) => Promise<void>;
  initialData?: TypePdv | null;
}

export function TypePdvFormModal({ open, onOpenChange, onSubmit, initialData }: TypePdvFormModalProps) {
  const form = useForm<z.infer<typeof typePdvSchema>>({
    resolver: zodResolver(typePdvSchema),
    defaultValues: {
      nom_type: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom_type: initialData.nom_type,
      });
    } else {
      form.reset({
        nom_type: "",
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: z.infer<typeof typePdvSchema>) => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le type" : "Ajouter un type de PDV"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du type</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Kiosque, Épicerie..." {...field} />
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
                {initialData ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
