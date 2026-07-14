'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/lib/schemas";
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
import { Client } from "@/types";
import { useEffect } from "react";
import { useZones } from "@/hooks/useZones";
import { useTypePdvs } from "@/hooks/useTypePdvs";
import { MobileSheet } from "@/components/ui/mobile-sheet";

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  initialData?: Client | null;
}

export function ClientFormModal({ open, onOpenChange, onSubmit, initialData }: ClientFormModalProps) {
  const { zones } = useZones();
  const { types } = useTypePdvs();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom_pdv: "",
      type_pdv_id: "",
      nom_responsable: "",
      telephone: "",
      localisation: "",
      zone_id: "",
      actif: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom_pdv: initialData.nom_pdv,
        type_pdv_id: initialData.type_pdv_id || "",
        nom_responsable: initialData.nom_responsable || "",
        telephone: initialData.telephone || "",
        localisation: initialData.localisation || "",
        zone_id: initialData.zone_id || "",
        actif: initialData.actif,
      });
    } else {
      form.reset({
        nom_pdv: "",
        type_pdv_id: "",
        nom_responsable: "",
        telephone: "",
        localisation: "",
        zone_id: "",
        actif: true,
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: ClientFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch {
      // erreur geree par le parent
    }
  };

  const title = initialData ? "Modifier le client" : "Ajouter un client";

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nom_pdv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du PDV</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Epicerie du Coin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type_pdv_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de PDV</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nom_type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zone_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
            name="nom_responsable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du responsable</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Jean Dupont" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone</FormLabel>
                <FormControl>
                  <Input placeholder="ex: +261 34 00 000 00" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="localisation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation precise</FormLabel>
                <FormControl>
                  <Input placeholder="ex: A cote de la poste" {...field} value={field.value || ""} />
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
                  <FormLabel>Client actif</FormLabel>
                </div>
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