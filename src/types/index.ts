// ============================================
// ENUMS (miroir des types Postgres)
// ============================================

export type RoleUtilisateur = 'ADMIN' | 'GERANT' | 'LIVREUR';

export type CategorieProduit = 'YAOURT' | 'JUS';

export type StatutCommande =
  | 'EN_ATTENTE'
  | 'PREPARATION'
  | 'EN_LIVRAISON'
  | 'LIVRE_PAYE'
  | 'LIVRE_DETTE'
  | 'ANNULE';

export type StatutPreparation = 'EN_COURS' | 'TERMINEE';

// ============================================
// ENTITÉS (miroir des tables Postgres)
// ============================================

export interface Societe {
  id: string;
  nom: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface Zone {
  id: string;
  societe_id: string;
  nom: string;
  ville: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypePdv {
  id: string;
  societe_id: string;
  nom_type: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Utilisateur {
  id: string;
  societe_id: string;
  code_livreur: string | null;
  nom: string;
  email: string | null;
  telephone: string | null;
  role: RoleUtilisateur;
  zone_id: string | null;
  actif: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations optionnelles (populées via join)
  zone?: Zone;
}

export interface Client {
  id: string;
  societe_id: string;
  code_client: string | null;
  nom_pdv: string;
  type_pdv_id: string | null;
  nom_responsable: string | null;
  telephone: string | null;
  localisation: string | null;
  zone_id: string | null;
  actif: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations optionnelles
  zone?: Zone;
  type_pdv?: TypePdv;
}

export interface Produit {
  id: string;
  societe_id: string;
  code_produit: string | null;
  nom_produit: string;
  categorie: CategorieProduit;
  prix: number;
  prix_achat: number | null;
  stock_min: number;
  saison: string | null;
  actif: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LigneCommande {
  id: string;
  commande_id: string;
  produit_id: string;
  societe_id: string;
  quantite: number;
  prix_unitaire: number;
  categorie: CategorieProduit;
  total_ligne: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations optionnelles
  produit?: Produit;
}

export interface Commande {
  id: string;
  societe_id: string;
  code_commande: string | null;
  client_id: string;
  livreur_assigne_id: string | null;
  statut: StatutCommande;
  date_commande: string;
  date_livraison: string | null;
  commentaire: string | null;
  total_yaourt: number;
  total_jus: number;
  parfums_yaourt: string | null;
  parfums_jus: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations optionnelles
  client?: Client;
  livreur?: Utilisateur;
  lignes_commande?: LigneCommande[];
  encaissement?: Encaissement;
  recouvrements?: Recouvrement[];
}

export interface Encaissement {
  id: string;
  code_encaissement: string | null;
  commande_id: string;
  societe_id: string;
  montant_total: number;
  montant_encaisse: number;
  dette: number;
  date_encaissement: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recouvrement {
  id: string;
  code_recouvrement: string | null;
  commande_id: string;
  livreur_id: string;
  societe_id: string;
  montant_recouvre: number;
  dette_avant: number | null;
  dette_apres: number | null;
  date_recouvrement: string;
  mode_paiement: string;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreparationCommande {
  id: string;
  code_prepa: string | null;
  commande_id: string;
  livreur_id: string;
  societe_id: string;
  date_prepa: string;
  statut_prepa: StatutPreparation;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// VUES (rapports agrégés)
// ============================================

export interface ClientDette {
  client_id: string;
  nom_pdv: string;
  societe_id: string;
  dette_actuelle: number;
}

export interface PerformanceLivreur {
  livreur_id: string;
  livreur_nom: string;
  societe_id: string;
  encaisse_aujourdhui: number;
  recouvre_aujourdhui: number;
  encaisse_ce_mois: number;
  recouvre_ce_mois: number;
  total_encaisse: number;
  total_recouvre: number;
  total_dette: number;
  nb_commandes: number;
}

export interface CompteJourLivreur {
  livreur_id: string;
  livreur_nom: string;
  societe_id: string;
  date_jour: string;
  total_encaissements_jour: number;
  total_recouvrements_jour: number;
  total_a_reverser: number;
}

// ============================================
// FORMS / INPUTS (pour créer/modifier)
// ============================================

export interface CreateCommandeInput {
  client_id: string;
  date_livraison?: string;
  commentaire?: string;
  lignes: {
    produit_id: string;
    quantite: number;
    prix_unitaire: number;
    categorie: CategorieProduit;
  }[];
}

export interface CreateRecouvrementInput {
  commande_id: string;
  montant_recouvre: number;
  mode_paiement?: string;
  notes?: string;
}

export interface CreateClientInput {
  nom_pdv: string;
  type_pdv_id?: string;
  nom_responsable?: string;
  telephone?: string;
  localisation?: string;
  zone_id?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  commandes_du_jour: number;
  montant_encaisse_jour: number;
  dettes_en_cours: number;
  commandes_par_statut: Record<StatutCommande, number>;
}

// ============================================
// AUTH CONTEXT
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  utilisateur: Utilisateur;
  societe: Societe;
}
