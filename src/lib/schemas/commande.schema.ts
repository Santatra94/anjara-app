import * as z from "zod";

export const commandeCreateSchema = z.object({
  client_id: z.string().uuid("Client obligatoire"),
  date_livraison: z.string().min(1, "Date obligatoire"),
  total_yaourt_commande: z.number().min(0),
  total_jus_commande: z.number().min(0),
  parfums_yaourt_souhaites: z.string().optional(),
  parfums_jus_souhaites: z.string().optional(),
  commentaire: z.string().optional(),
}).refine(
  (data) => (data.total_yaourt_commande ?? 0) > 0 || (data.total_jus_commande ?? 0) > 0,
  { message: "La commande ne peut pas être vide", path: ["total_yaourt_commande"] }
).refine(
  (data) => (data.total_yaourt_commande ?? 0) === 0 || (data.parfums_yaourt_souhaites?.length ?? 0) > 0,
  { message: "Sélectionne au moins un parfum yaourt", path: ["parfums_yaourt_souhaites"] }
).refine(
  (data) => (data.total_jus_commande ?? 0) === 0 || (data.parfums_jus_souhaites?.length ?? 0) > 0,
  { message: "Sélectionne au moins un parfum jus", path: ["parfums_jus_souhaites"] }
);

export const ligneCommandeSchema = z.object({
  commande_id: z.string().uuid(),
  produit_id: z.string().uuid("Produit obligatoire"),
  quantite: z.number().positive("Quantité obligatoire"),
  prix_unitaire: z.number().min(0),
  categorie: z.enum(["YAOURT", "JUS"]),
});

export type CommandeCreateValues = z.infer<typeof commandeCreateSchema>;
export type LigneCommandeValues = z.infer<typeof ligneCommandeSchema>;
