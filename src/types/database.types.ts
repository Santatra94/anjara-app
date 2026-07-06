export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      societes: {
        Row: {
          id: string
          nom: string
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          nom: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          nom?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      zones: {
        Row: {
          id: string
          societe_id: string
          nom: string
          ville: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          societe_id: string
          nom: string
          ville?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          nom?: string
          ville?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      type_pdv: {
        Row: {
          id: string
          societe_id: string
          nom_type: string
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          societe_id: string
          nom_type: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          nom_type?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      utilisateurs: {
        Row: {
          id: string
          societe_id: string
          code_livreur: string | null
          nom: string
          email: string | null
          telephone: string | null
          role: 'ADMIN' | 'GERANT' | 'LIVREUR'
          zone_id: string | null
          actif: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id: string
          societe_id: string
          code_livreur?: string | null
          nom: string
          email?: string | null
          telephone?: string | null
          role: 'ADMIN' | 'GERANT' | 'LIVREUR'
          zone_id?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          code_livreur?: string | null
          nom?: string
          email?: string | null
          telephone?: string | null
          role?: 'ADMIN' | 'GERANT' | 'LIVREUR'
          zone_id?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      clients: {
        Row: {
          id: string
          societe_id: string
          code_client: string | null
          nom_pdv: string
          type_pdv_id: string | null
          nom_responsable: string | null
          telephone: string | null
          localisation: string | null
          zone_id: string | null
          actif: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          societe_id: string
          code_client?: string | null
          nom_pdv: string
          type_pdv_id?: string | null
          nom_responsable?: string | null
          telephone?: string | null
          localisation?: string | null
          zone_id?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          code_client?: string | null
          nom_pdv?: string
          type_pdv_id?: string | null
          nom_responsable?: string | null
          telephone?: string | null
          localisation?: string | null
          zone_id?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      produits: {
        Row: {
          id: string
          societe_id: string
          code_produit: string | null
          nom_produit: string
          categorie: 'YAOURT' | 'JUS'
          prix: number
          prix_achat: number | null
          stock_min: number | null
          saison: string | null
          actif: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          societe_id: string
          code_produit?: string | null
          nom_produit: string
          categorie: 'YAOURT' | 'JUS'
          prix: number
          prix_achat?: number | null
          stock_min?: number | null
          saison?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          code_produit?: string | null
          nom_produit?: string
          categorie?: 'YAOURT' | 'JUS'
          prix?: number
          prix_achat?: number | null
          stock_min?: number | null
          saison?: string | null
          actif?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      commandes: {
        Row: {
          id: string
          societe_id: string
          code_commande: string | null
          client_id: string
          livreur_assigne_id: string | null
          statut: 'EN_ATTENTE' | 'PREPARATION' | 'EN_LIVRAISON' | 'LIVRE_PAYE' | 'LIVRE_DETTE' | 'ANNULE'
          date_commande: string | null
          date_livraison: string | null
          commentaire: string | null
          total_yaourt_commande: number | null
          total_jus_commande: number | null
          parfums_yaourt_souhaites: string | null
          parfums_jus_souhaites: string | null
          total_yaourt: number | null
          total_jus: number | null
          parfums_yaourt: string | null
          parfums_jus: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          societe_id: string
          code_commande?: string | null
          client_id: string
          livreur_assigne_id?: string | null
          statut?: 'EN_ATTENTE' | 'PREPARATION' | 'EN_LIVRAISON' | 'LIVRE_PAYE' | 'LIVRE_DETTE' | 'ANNULE'
          date_commande?: string | null
          date_livraison?: string | null
          commentaire?: string | null
          total_yaourt_commande?: number | null
          total_jus_commande?: number | null
          parfums_yaourt_souhaites?: string | null
          parfums_jus_souhaites?: string | null
          total_yaourt?: number | null
          total_jus?: number | null
          parfums_yaourt?: string | null
          parfums_jus?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          societe_id?: string
          code_commande?: string | null
          client_id?: string
          livreur_assigne_id?: string | null
          statut?: 'EN_ATTENTE' | 'PREPARATION' | 'EN_LIVRAISON' | 'LIVRE_PAYE' | 'LIVRE_DETTE' | 'ANNULE'
          date_commande?: string | null
          date_livraison?: string | null
          commentaire?: string | null
          total_yaourt_commande?: number | null
          total_jus_commande?: number | null
          parfums_yaourt_souhaites?: string | null
          parfums_jus_souhaites?: string | null
          total_yaourt?: number | null
          total_jus?: number | null
          parfums_yaourt?: string | null
          parfums_jus?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      lignes_commande: {
        Row: {
          id: string
          commande_id: string
          produit_id: string
          societe_id: string
          quantite: number
          prix_unitaire: number
          categorie: 'YAOURT' | 'JUS'
          total_ligne: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          commande_id: string
          produit_id: string
          societe_id?: string
          quantite: number
          prix_unitaire: number
          categorie: 'YAOURT' | 'JUS'
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          commande_id?: string
          produit_id?: string
          societe_id?: string
          quantite?: number
          prix_unitaire?: number
          categorie?: 'YAOURT' | 'JUS'
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      encaissements: {
        Row: {
          id: string
          code_encaissement: string | null
          commande_id: string
          societe_id: string
          montant_total: number
          montant_encaisse: number | null
          dette: number | null
          date_encaissement: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          code_encaissement?: string | null
          commande_id: string
          societe_id: string
          montant_total: number
          montant_encaisse?: number | null
          date_encaissement?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          code_encaissement?: string | null
          commande_id?: string
          societe_id?: string
          montant_total?: number
          montant_encaisse?: number | null
          date_encaissement?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      recouvrements: {
        Row: {
          id: string
          code_recouvrement: string | null
          commande_id: string
          livreur_id: string
          societe_id: string
          montant_recouvre: number
          dette_avant: number | null
          dette_apres: number | null
          date_recouvrement: string | null
          mode_paiement: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          code_recouvrement?: string | null
          commande_id: string
          livreur_id: string
          societe_id?: string
          montant_recouvre: number
          date_recouvrement?: string | null
          mode_paiement?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          code_recouvrement?: string | null
          commande_id?: string
          livreur_id?: string
          societe_id?: string
          montant_recouvre?: number
          date_recouvrement?: string | null
          mode_paiement?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
      preparations_commande: {
        Row: {
          id: string
          code_prepa: string | null
          commande_id: string
          livreur_id: string
          societe_id: string
          date_prepa: string | null
          statut_prepa: 'EN_COURS' | 'TERMINEE' | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          code_prepa?: string | null
          commande_id: string
          livreur_id: string
          societe_id?: string
          date_prepa?: string | null
          statut_prepa?: 'EN_COURS' | 'TERMINEE' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          code_prepa?: string | null
          commande_id?: string
          livreur_id?: string
          societe_id?: string
          date_prepa?: string | null
          statut_prepa?: 'EN_COURS' | 'TERMINEE' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
      }
    }
    Views: {
      v_clients_dettes: {
        Row: {
          client_id: string
          nom_pdv: string
          societe_id: string
          dette_actuelle: number | null
        }
      }
      v_performance_livreurs: {
        Row: {
          livreur_id: string
          livreur_nom: string
          societe_id: string
          encaisse_aujourdhui: number | null
          recouvre_aujourdhui: number | null
          encaisse_ce_mois: number | null
          recouvre_ce_mois: number | null
          total_encaisse: number | null
          total_recouvre: number | null
          total_dette: number | null
          nb_commandes: number | null
        }
      }
      v_compte_jour_livreur: {
        Row: {
          livreur_id: string
          livreur_nom: string
          societe_id: string
          date_jour: string
          total_encaissements_jour: number | null
          total_recouvrements_jour: number | null
          total_a_reverser: number | null
        }
      }
      v_ecart_commande_preparation: {
        Row: {
          commande_id: string
          code_commande: string | null
          societe_id: string
          client_id: string
          nom_pdv: string
          statut: 'EN_ATTENTE' | 'PREPARATION' | 'EN_LIVRAISON' | 'LIVRE_PAYE' | 'LIVRE_DETTE' | 'ANNULE'
          yaourt_demande: number | null
          yaourt_prepare: number | null
          ecart_yaourt: number | null
          jus_demande: number | null
          jus_prepare: number | null
          ecart_jus: number | null
          statut_preparation: 'COMPLET' | 'PARTIEL' | 'NON_PREPARE'
        }
      }
      v_production_du_jour: {
        Row: {
          societe_id: string
          date_jour: string
          total_yaourt_a_produire: number | null
          total_jus_a_produire: number | null
          nb_commandes: number | null
          nb_clients: number | null
        }
      }
    }
    Enums: {
      role_utilisateur: 'ADMIN' | 'GERANT' | 'LIVREUR'
      categorie_produit: 'YAOURT' | 'JUS'
      statut_commande: 'EN_ATTENTE' | 'PREPARATION' | 'EN_LIVRAISON' | 'LIVRE_PAYE' | 'LIVRE_DETTE' | 'ANNULE'
      statut_preparation: 'EN_COURS' | 'TERMINEE'
    }
  }
}

// Types helpers pour usage direct
export type Societe = Database['public']['Tables']['societes']['Row']
export type Zone = Database['public']['Tables']['zones']['Row']
export type TypePdv = Database['public']['Tables']['type_pdv']['Row']
export type Utilisateur = Database['public']['Tables']['utilisateurs']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Produit = Database['public']['Tables']['produits']['Row']
export type Commande = Database['public']['Tables']['commandes']['Row']
export type LigneCommande = Database['public']['Tables']['lignes_commande']['Row']
export type Encaissement = Database['public']['Tables']['encaissements']['Row']
export type Recouvrement = Database['public']['Tables']['recouvrements']['Row']
export type PreparationCommande = Database['public']['Tables']['preparations_commande']['Row']

export type EcartCommandePreparation = Database['public']['Views']['v_ecart_commande_preparation']['Row']
export type ProductionDuJour = Database['public']['Views']['v_production_du_jour']['Row']
export type ClientDette = Database['public']['Views']['v_clients_dettes']['Row']
export type PerformanceLivreur = Database['public']['Views']['v_performance_livreurs']['Row']
export type CompteJourLivreur = Database['public']['Views']['v_compte_jour_livreur']['Row']

export type RoleUtilisateur = Database['public']['Enums']['role_utilisateur']
export type CategorieProduit = Database['public']['Enums']['categorie_produit']
export type StatutCommande = Database['public']['Enums']['statut_commande']
export type StatutPreparation = Database['public']['Enums']['statut_preparation']
