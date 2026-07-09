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
          ordre_tournee: number | null
          date_livraison_effective: string | null
          nom_receptionnaire: string | null
          mode_paiement_livraison: string | null
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
          ordre_tournee?: number | null
          date_livraison_effective?: string | null
          nom_receptionnaire?: string | null
          mode_paiement_livraison?: string | null
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
          ordre_tournee?: number | null
          date_livraison_effective?: string | null
          nom_receptionnaire?: string | null
          mode_paiement_livraison?: string | null
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
      promesses_recouvrement: {
        Row: {
          id: string
          encaissement_id: string
          commande_id: string
          societe_id: string
          livreur_id: string | null
          date_prevue: string
          montant_promis: number | null
          statut: 'EN_ATTENTE' | 'HONOREE_COMPLETE' | 'HONOREE_PARTIELLE' | 'REPORTEE'
          date_effective: string | null
          montant_effectif: number | null
          notes: string | null
          ordre_tournee: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          is_archived: boolean | null
        }
        Insert: {
          id?: string
          encaissement_id: string
          commande_id: string
          societe_id: string
          livreur_id?: string | null
          date_prevue: string
          montant_promis?: number | null
          statut?: 'EN_ATTENTE' | 'HONOREE_COMPLETE' | 'HONOREE_PARTIELLE' | 'REPORTEE'
          date_effective?: string | null
          montant_effectif?: number | null
          notes?: string | null
          ordre_tournee?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          is_archived?: boolean | null
        }
        Update: {
          id?: string
          encaissement_id?: string
          commande_id?: string
          societe_id?: string
          livreur_id?: string | null
          date_prevue?: string
          montant_promis?: number | null
          statut?: 'EN_ATTENTE' | 'HONOREE_COMPLETE' | 'HONOREE_PARTIELLE' | 'REPORTEE'
          date_effective?: string | null
          montant_effectif?: number | null
          notes?: string | null
          ordre_tournee?: number | null
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
          created_by: string | 