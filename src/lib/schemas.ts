import * as z from "zod";

export const zoneSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  ville: z.string().optional().nullable(),
});

export const typePdvSchema = z.object({
  nom_type: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

export const produitSchema = z.object({
  nom_produit: z.string().min(2, "Le nom est requis"),
  categorie: z.enum(["YAOURT", "JUS"]),
  prix: z.number().min(0, "Le prix doit être positif"),
  prix_achat: z.number().min(0).nullable().optional(),
  stock_min: z.number().min(0),
  saison: z.string().optional().nullable(),
  actif: z.boolean(),
});

export const clientSchema = z.object({
  nom_pdv: z.string().min(2, "Le nom du PDV est requis"),
  type_pdv_id: z.string().uuid("Le type de PDV est requis"),
  nom_responsable: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  localisation: z.string().optional().nullable(),
  zone_id: z.string().uuid("La zone est requise"),
  actif: z.boolean(),
});

export const livreurSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal('')),
  telephone: z.string().optional().nullable(),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères").optional(),
  zone_id: z.string().uuid("La zone est requise").optional().nullable(),
  actif: z.boolean(),
});
