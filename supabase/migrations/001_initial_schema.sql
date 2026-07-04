-- Initial Migration for Anjara Project
-- Target: Supabase (PostgreSQL)

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. ENUM TYPES
-- ==========================================
CREATE TYPE role_utilisateur AS ENUM ('ADMIN', 'GERANT', 'LIVREUR');
CREATE TYPE categorie_produit AS ENUM ('YAOURT', 'JUS');
CREATE TYPE statut_commande AS ENUM ('EN_ATTENTE', 'PREPARATION', 'EN_LIVRAISON', 'LIVRE_PAYE', 'LIVRE_DETTE', 'ANNULE');
CREATE TYPE statut_preparation AS ENUM ('EN_COURS', 'TERMINEE');

-- ==========================================
-- 3. TABLES
-- ==========================================

-- 3.1 Societes (Multi-tenant root)
CREATE TABLE societes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.2 Zones
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    societe_id UUID NOT NULL REFERENCES societes(id),
    nom TEXT NOT NULL,
    ville TEXT DEFAULT 'Antananarivo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.3 Type PDV
CREATE TABLE type_pdv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    societe_id UUID NOT NULL REFERENCES societes(id),
    nom_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.4 Utilisateurs (Extends auth.users)
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    societe_id UUID NOT NULL REFERENCES societes(id),
    code_livreur TEXT UNIQUE,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    role role_utilisateur NOT NULL,
    zone_id UUID REFERENCES zones(id),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- Unique index to enforce one active livreur per zone per societe
CREATE UNIQUE INDEX idx_unique_active_livreur_per_zone
ON utilisateurs (societe_id, zone_id)
WHERE (role = 'LIVREUR' AND actif = TRUE AND is_archived = FALSE);

-- 3.5 Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    societe_id UUID NOT NULL REFERENCES societes(id),
    code_client TEXT, -- Auto-generated
    nom_pdv TEXT NOT NULL,
    type_pdv_id UUID REFERENCES type_pdv(id),
    nom_responsable TEXT,
    telephone TEXT,
    localisation TEXT,
    zone_id UUID REFERENCES zones(id),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.6 Produits
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    societe_id UUID NOT NULL REFERENCES societes(id),
    code_produit TEXT, -- Auto-generated
    nom_produit TEXT NOT NULL,
    categorie categorie_produit NOT NULL,
    prix NUMERIC(10,2) NOT NULL,
    prix_achat NUMERIC(10,2),
    stock_min NUMERIC(10,3) DEFAULT 0,
    saison TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.7 Commandes
CREATE TABLE commandes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    societe_id UUID NOT NULL REFERENCES societes(id),
    code_commande TEXT, -- Auto-generated
    client_id UUID NOT NULL REFERENCES clients(id),
    livreur_assigne_id UUID REFERENCES utilisateurs(id),
    statut statut_commande DEFAULT 'EN_ATTENTE',
    date_commande TIMESTAMPTZ DEFAULT NOW(),
    date_livraison DATE,
    commentaire TEXT,
    total_yaourt NUMERIC(10,3) DEFAULT 0,
    total_jus NUMERIC(10,3) DEFAULT 0,
    parfums_yaourt TEXT,
    parfums_jus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.8 Lignes de commande
CREATE TABLE lignes_commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produits(id),
    societe_id UUID NOT NULL REFERENCES societes(id),
    quantite NUMERIC(10,3) NOT NULL CHECK (quantite > 0),
    prix_unitaire NUMERIC(10,2) NOT NULL,
    categorie categorie_produit NOT NULL,
    total_ligne NUMERIC(10,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.9 Encaissements
CREATE TABLE encaissements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_encaissement TEXT, -- Auto-generated
    commande_id UUID UNIQUE NOT NULL REFERENCES commandes(id),
    societe_id UUID NOT NULL REFERENCES societes(id),
    montant_total NUMERIC(10,2) NOT NULL,
    montant_encaisse NUMERIC(10,2) DEFAULT 0 CHECK (montant_encaisse >= 0),
    dette NUMERIC(10,2) GENERATED ALWAYS AS (GREATEST(0, montant_total - montant_encaisse)) STORED,
    date_encaissement TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_montant_encaisse_max CHECK (montant_encaisse <= montant_total)
);

-- 3.10 Recouvrements
CREATE TABLE recouvrements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_recouvrement TEXT, -- Auto-generated
    commande_id UUID NOT NULL REFERENCES commandes(id),
    livreur_id UUID NOT NULL REFERENCES utilisateurs(id),
    societe_id UUID NOT NULL REFERENCES societes(id),
    montant_recouvre NUMERIC(10,2) NOT NULL CHECK (montant_recouvre > 0),
    dette_avant NUMERIC(10,2), -- Calculated
    dette_apres NUMERIC(10,2), -- Calculated
    date_recouvrement DATE DEFAULT CURRENT_DATE,
    mode_paiement TEXT DEFAULT 'ESPECES',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- 3.11 Preparations commande
CREATE TABLE preparations_commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_prepa TEXT, -- Auto-generated
    commande_id UUID NOT NULL REFERENCES commandes(id),
    livreur_id UUID NOT NULL REFERENCES utilisateurs(id),
    societe_id UUID NOT NULL REFERENCES societes(id),
    date_prepa DATE DEFAULT CURRENT_DATE,
    statut_prepa statut_preparation DEFAULT 'EN_COURS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 4. HELPER FUNCTIONS
-- ==========================================

-- 4.1 Normalize telephone
CREATE OR REPLACE FUNCTION fn_normalize_telephone(tel TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF tel IS NULL THEN RETURN NULL; END IF;

    -- Remove spaces, dashes, dots
    cleaned := regexp_replace(tel, '[^0-9+]', '', 'g');

    -- If already starts with +261
    IF cleaned LIKE '+261%' THEN
        RETURN cleaned;
    END IF;

    -- If starts with 0 and has 10 digits
    IF cleaned ~ '^0[0-9]{9}$' THEN
        RETURN '+261' || substr(cleaned, 2);
    END IF;

    -- If has 9 digits without 0
    IF cleaned ~ '^[0-9]{9}$' THEN
        RETURN '+261' || cleaned;
    END IF;

    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4.2 Get current user societe_id
CREATE OR REPLACE FUNCTION get_user_societe_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT societe_id FROM utilisateurs WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4.3 Get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS role_utilisateur AS $$
BEGIN
    RETURN (SELECT role FROM utilisateurs WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- 5. TRIGGER FUNCTIONS
-- ==========================================

-- 5.1 Update updated_at
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Auto-fill Audit Columns
CREATE OR REPLACE FUNCTION fn_handle_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NULL THEN
            NEW.created_by := auth.uid();
        END IF;
        IF NEW.updated_by IS NULL THEN
            NEW.updated_by := auth.uid();
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF auth.uid() IS NOT NULL THEN
            NEW.updated_by := auth.uid();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Prevent hard delete
CREATE OR REPLACE FUNCTION fn_prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete is forbidden. Use is_archived = true.';
END;
$$ LANGUAGE plpgsql;

-- 5.4 Normalize telephone trigger
CREATE OR REPLACE FUNCTION fn_trigger_normalize_telephone()
RETURNS TRIGGER AS $$
BEGIN
    NEW.telephone := fn_normalize_telephone(NEW.telephone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.5 Generate Code Client
CREATE OR REPLACE FUNCTION fn_generate_code_client()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.code_client IS NULL THEN
        SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num
        FROM clients
        WHERE societe_id = NEW.societe_id;

        NEW.code_client := 'CLT' || LPAD(next_num::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Generate Code Produit
CREATE OR REPLACE FUNCTION fn_generate_code_produit()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.code_produit IS NULL THEN
        SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num
        FROM produits
        WHERE societe_id = NEW.societe_id;

        NEW.code_produit := 'PRD' || LPAD(next_num::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 Generate Code Commande
CREATE OR REPLACE FUNCTION fn_generate_code_commande()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.code_commande IS NULL THEN
        SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num
        FROM commandes
        WHERE societe_id = NEW.societe_id;

        NEW.code_commande := 'COM-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.8 Update Commande Totaux
CREATE OR REPLACE FUNCTION fn_update_commande_totaux()
RETURNS TRIGGER AS $$
DECLARE
    target_commande_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_commande_id := OLD.commande_id;
    ELSE
        target_commande_id := NEW.commande_id;
    END IF;

    UPDATE commandes
    SET
        total_yaourt = (SELECT COALESCE(SUM(quantite), 0) FROM lignes_commande WHERE commande_id = target_commande_id AND categorie = 'YAOURT' AND is_archived = FALSE),
        total_jus = (SELECT COALESCE(SUM(quantite), 0) FROM lignes_commande WHERE commande_id = target_commande_id AND categorie = 'JUS' AND is_archived = FALSE),
        parfums_yaourt = (
            SELECT string_agg(DISTINCT p.nom_produit, ', ')
            FROM lignes_commande lc
            JOIN produits p ON lc.produit_id = p.id
            WHERE lc.commande_id = target_commande_id AND lc.categorie = 'YAOURT' AND lc.is_archived = FALSE
        ),
        parfums_jus = (
            SELECT string_agg(DISTINCT p.nom_produit, ', ')
            FROM lignes_commande lc
            JOIN produits p ON lc.produit_id = p.id
            WHERE lc.commande_id = target_commande_id AND lc.categorie = 'JUS' AND lc.is_archived = FALSE
        ),
        updated_at = NOW()
    WHERE id = target_commande_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.9 Create Encaissement on Livraison
CREATE OR REPLACE FUNCTION fn_create_encaissement_on_livraison()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC(10,2);
BEGIN
    IF NEW.statut = 'EN_LIVRAISON' AND (OLD.statut IS NULL OR OLD.statut != 'EN_LIVRAISON') THEN
        SELECT COALESCE(SUM(total_ligne), 0) INTO v_total
        FROM lignes_commande
        WHERE commande_id = NEW.id AND is_archived = FALSE;

        INSERT INTO encaissements (
            commande_id,
            societe_id,
            montant_total,
            montant_encaisse,
            code_encaissement
        ) VALUES (
            NEW.id,
            NEW.societe_id,
            v_total,
            0,
            'ENC-' || UPPER(SUBSTR(NEW.id::TEXT, 1, 4))
        )
        ON CONFLICT (commande_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.10 Update Status after Encaissement
CREATE OR REPLACE FUNCTION fn_update_statut_after_encaissement()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if we are in EN_LIVRAISON (or transitioning)
    -- Actually, the rule says when montant_encaisse is updated/inserted while commande is EN_LIVRAISON
    UPDATE commandes
    SET statut = CASE
        WHEN NEW.dette = 0 THEN 'LIVRE_PAYE'::statut_commande
        ELSE 'LIVRE_DETTE'::statut_commande
    END
    WHERE id = NEW.commande_id AND statut = 'EN_LIVRAISON';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.11 Before Recouvrement Insert
CREATE OR REPLACE FUNCTION fn_before_recouvrement_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_dette_initiale NUMERIC(10,2);
    v_total_recouvre_prev NUMERIC(10,2);
BEGIN
    -- Get initial dette from encaissements
    SELECT montant_total INTO v_dette_initiale
    FROM encaissements
    WHERE commande_id = NEW.commande_id;

    -- Get sum of previous recouvrements
    SELECT COALESCE(SUM(montant_recouvre), 0) INTO v_total_recouvre_prev
    FROM recouvrements
    WHERE commande_id = NEW.commande_id AND is_archived = FALSE;

    NEW.dette_avant := v_dette_initiale - (
        (SELECT COALESCE(montant_encaisse, 0) FROM encaissements WHERE commande_id = NEW.commande_id) + v_total_recouvre_prev
    );

    IF NEW.montant_recouvre > NEW.dette_avant THEN
        RAISE EXCEPTION 'Le montant du recouvrement (%) est supérieur à la dette restante (%)', NEW.montant_recouvre, NEW.dette_avant;
    END IF;

    NEW.dette_apres := NEW.dette_avant - NEW.montant_recouvre;

    IF NEW.code_recouvrement IS NULL THEN
        NEW.code_recouvrement := 'REC-' || UPPER(REPLACE(uuid_generate_v4()::TEXT, '-', ''));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.12 After Recouvrement Insert
CREATE OR REPLACE FUNCTION fn_after_recouvrement_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dette_apres = 0 THEN
        UPDATE commandes
        SET statut = 'LIVRE_PAYE'
        WHERE id = NEW.commande_id AND statut = 'LIVRE_DETTE';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.13 Assign Livreur by Zone
CREATE OR REPLACE FUNCTION fn_assign_livreur_by_zone()
RETURNS TRIGGER AS $$
DECLARE
    v_zone_id UUID;
    v_livreur_id UUID;
BEGIN
    IF NEW.livreur_assigne_id IS NULL THEN
        -- Get client.zone_id
        SELECT zone_id INTO v_zone_id FROM clients WHERE id = NEW.client_id;

        -- Find first active livreur with same zone_id
        SELECT id INTO v_livreur_id
        FROM utilisateurs
        WHERE zone_id = v_zone_id
          AND role = 'LIVREUR'
          AND actif = TRUE
          AND is_archived = FALSE
        ORDER BY created_at ASC
        LIMIT 1;

        NEW.livreur_assigne_id := v_livreur_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.14 Auto-populate societe_id for child tables
CREATE OR REPLACE FUNCTION fn_populate_societe_id_from_commande()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.societe_id IS NULL THEN
        SELECT societe_id INTO NEW.societe_id FROM commandes WHERE id = NEW.commande_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.15 Generate Code Prepa
CREATE OR REPLACE FUNCTION fn_generate_code_prepa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code_prepa IS NULL THEN
        NEW.code_prepa := 'PREP-' || UPPER(REPLACE(uuid_generate_v4()::TEXT, '-', ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. TRIGGERS
-- ==========================================

-- Attach Generic Triggers to all tables
DO $$
DECLARE
    t text;
    tables text[] := ARRAY['societes', 'zones', 'type_pdv', 'utilisateurs', 'clients', 'produits', 'commandes', 'lignes_commande', 'encaissements', 'recouvrements', 'preparations_commande'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Updated_at
        EXECUTE format('CREATE TRIGGER tr_update_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()', t);
        -- Audit columns
        EXECUTE format('CREATE TRIGGER tr_handle_audit_columns BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_handle_audit_columns()', t);
        -- Prevent Hard Delete
        EXECUTE format('CREATE TRIGGER tr_prevent_hard_delete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_prevent_hard_delete()', t);
    END LOOP;
END $$;

-- Clients
CREATE TRIGGER tr_normalize_telephone_client BEFORE INSERT OR UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION fn_trigger_normalize_telephone();
CREATE TRIGGER tr_generate_code_client BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION fn_generate_code_client();

-- Utilisateurs
CREATE TRIGGER tr_normalize_telephone_utilisateur BEFORE INSERT OR UPDATE ON utilisateurs FOR EACH ROW EXECUTE FUNCTION fn_trigger_normalize_telephone();

-- Produits
CREATE TRIGGER tr_generate_code_produit BEFORE INSERT ON produits FOR EACH ROW EXECUTE FUNCTION fn_generate_code_produit();

-- Commandes
CREATE TRIGGER tr_generate_code_commande BEFORE INSERT ON commandes FOR EACH ROW EXECUTE FUNCTION fn_generate_code_commande();
CREATE TRIGGER tr_assign_livreur_by_zone BEFORE INSERT ON commandes FOR EACH ROW EXECUTE FUNCTION fn_assign_livreur_by_zone();
CREATE TRIGGER tr_create_encaissement_on_livraison AFTER UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION fn_create_encaissement_on_livraison();

-- Lignes Commande
CREATE TRIGGER tr_populate_societe_id_lignes_commande BEFORE INSERT ON lignes_commande FOR EACH ROW EXECUTE FUNCTION fn_populate_societe_id_from_commande();
CREATE TRIGGER tr_update_commande_totaux AFTER INSERT OR UPDATE OR DELETE ON lignes_commande FOR EACH ROW EXECUTE FUNCTION fn_update_commande_totaux();

-- Encaissements
CREATE TRIGGER tr_update_statut_after_encaissement AFTER INSERT OR UPDATE ON encaissements FOR EACH ROW EXECUTE FUNCTION fn_update_statut_after_encaissement();

-- Recouvrements
CREATE TRIGGER tr_populate_societe_id_recouvrement BEFORE INSERT ON recouvrements FOR EACH ROW EXECUTE FUNCTION fn_populate_societe_id_from_commande();
CREATE TRIGGER tr_before_recouvrement_insert BEFORE INSERT ON recouvrements FOR EACH ROW EXECUTE FUNCTION fn_before_recouvrement_insert();
CREATE TRIGGER tr_after_recouvrement_insert AFTER INSERT ON recouvrements FOR EACH ROW EXECUTE FUNCTION fn_after_recouvrement_insert();

-- Preparations
CREATE TRIGGER tr_populate_societe_id_prepa BEFORE INSERT ON preparations_commande FOR EACH ROW EXECUTE FUNCTION fn_populate_societe_id_from_commande();
CREATE TRIGGER tr_generate_code_prepa BEFORE INSERT ON preparations_commande FOR EACH ROW EXECUTE FUNCTION fn_generate_code_prepa();

-- ==========================================
-- 7. VIEWS (Security Invoker)
-- ==========================================

-- 7.1 Real-time debt per client
CREATE VIEW v_clients_dettes WITH (security_invoker = true) AS
SELECT
    c.id AS client_id,
    c.nom_pdv,
    c.societe_id,
    COALESCE(SUM(e.dette), 0) - COALESCE((
        SELECT SUM(r.montant_recouvre)
        FROM recouvrements r
        WHERE r.commande_id IN (SELECT id FROM commandes WHERE client_id = c.id)
          AND r.is_archived = FALSE
    ), 0) AS dette_actuelle
FROM clients c
LEFT JOIN commandes cmd ON cmd.client_id = c.id AND cmd.is_archived = FALSE
LEFT JOIN encaissements e ON e.commande_id = cmd.id AND e.is_archived = FALSE
WHERE c.is_archived = FALSE
GROUP BY c.id, c.nom_pdv, c.societe_id;

-- 7.2 Performance livreurs
CREATE VIEW v_performance_livreurs WITH (security_invoker = true) AS
SELECT
    u.id AS livreur_id,
    u.nom AS livreur_nom,
    u.societe_id,
    -- Encaissements aujourd'hui
    (SELECT COALESCE(SUM(montant_encaisse), 0) FROM encaissements e
     JOIN commandes c ON e.commande_id = c.id
     WHERE c.livreur_assigne_id = u.id AND e.date_encaissement::DATE = CURRENT_DATE AND e.is_archived = FALSE) AS encaisse_aujourdhui,
    -- Recouvrements aujourd'hui
    (SELECT COALESCE(SUM(montant_recouvre), 0) FROM recouvrements r
     WHERE r.livreur_id = u.id AND r.date_recouvrement = CURRENT_DATE AND r.is_archived = FALSE) AS recouvre_aujourdhui,
    -- Encaissements ce mois
    (SELECT COALESCE(SUM(montant_encaisse), 0) FROM encaissements e
     JOIN commandes c ON e.commande_id = c.id
     WHERE c.livreur_assigne_id = u.id AND date_trunc('month', e.date_encaissement) = date_trunc('month', CURRENT_DATE) AND e.is_archived = FALSE) AS encaisse_ce_mois,
    -- Recouvrements ce mois
    (SELECT COALESCE(SUM(montant_recouvre), 0) FROM recouvrements r
     WHERE r.livreur_id = u.id AND date_trunc('month', r.date_recouvrement) = date_trunc('month', CURRENT_DATE) AND r.is_archived = FALSE) AS recouvre_ce_mois,
    -- Totaux
    (SELECT COALESCE(SUM(montant_encaisse), 0) FROM encaissements e
     JOIN commandes c ON e.commande_id = c.id
     WHERE c.livreur_assigne_id = u.id AND e.is_archived = FALSE) AS total_encaisse,
    (SELECT COALESCE(SUM(montant_recouvre), 0) FROM recouvrements r
     WHERE r.livreur_id = u.id AND r.is_archived = FALSE) AS total_recouvre,
    -- Dette totale assignée
    (SELECT COALESCE(SUM(dette), 0) FROM encaissements e
     JOIN commandes c ON e.commande_id = c.id
     WHERE c.livreur_assigne_id = u.id AND e.is_archived = FALSE) -
    (SELECT COALESCE(SUM(montant_recouvre), 0) FROM recouvrements r
     WHERE r.livreur_id = u.id AND r.is_archived = FALSE) AS total_dette,
    -- Nombre de commandes
    (SELECT COUNT(*) FROM commandes WHERE livreur_assigne_id = u.id AND is_archived = FALSE) AS nb_commandes
FROM utilisateurs u
WHERE u.role = 'LIVREUR' AND u.is_archived = FALSE;

-- 7.3 Compte jour livreur
CREATE VIEW v_compte_jour_livreur WITH (security_invoker = true) AS
SELECT
    u.id AS livreur_id,
    u.nom AS livreur_nom,
    u.societe_id,
    CURRENT_DATE AS date_jour,
    COALESCE((
        SELECT SUM(e.montant_encaisse)
        FROM encaissements e
        JOIN commandes c ON e.commande_id = c.id
        WHERE c.livreur_assigne_id = u.id AND e.date_encaissement::DATE = CURRENT_DATE AND e.is_archived = FALSE
    ), 0) AS total_encaissements_jour,
    COALESCE((
        SELECT SUM(r.montant_recouvre)
        FROM recouvrements r
        WHERE r.livreur_id = u.id AND r.date_recouvrement = CURRENT_DATE AND r.is_archived = FALSE
    ), 0) AS total_recouvrements_jour,
    COALESCE((
        SELECT SUM(e.montant_encaisse)
        FROM encaissements e
        JOIN commandes c ON e.commande_id = c.id
        WHERE c.livreur_assigne_id = u.id AND e.date_encaissement::DATE = CURRENT_DATE AND e.is_archived = FALSE
    ), 0) + COALESCE((
        SELECT SUM(r.montant_recouvre)
        FROM recouvrements r
        WHERE r.livreur_id = u.id AND r.date_recouvrement = CURRENT_DATE AND r.is_archived = FALSE
    ), 0) AS total_a_reverser
FROM utilisateurs u
WHERE u.role = 'LIVREUR' AND u.is_archived = FALSE;

-- ==========================================
-- 8. RLS POLICIES
-- ==========================================

-- Enable RLS on all business tables
ALTER TABLE societes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_pdv ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE encaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recouvrements ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparations_commande ENABLE ROW LEVEL SECURITY;

-- 8.1 Universal Policies (Societes & Profil)

-- Societes: Users can see their own societe
CREATE POLICY "Users view their own societe" ON societes
    FOR SELECT TO authenticated
    USING (id = get_user_societe_id());

-- Utilisateurs: Users can view their own profile
CREATE POLICY "Users view their own profile" ON utilisateurs
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- 8.2 GERANT / ADMIN Policies (Universal within Societe)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY['utilisateurs', 'zones', 'type_pdv', 'clients', 'produits', 'commandes', 'lignes_commande', 'encaissements', 'recouvrements', 'preparations_commande'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "Gerant/Admin manage everything in their societe" ON %I
            FOR ALL TO authenticated
            USING (societe_id = get_user_societe_id() AND get_user_role() IN (''GERANT'', ''ADMIN''))
            WITH CHECK (societe_id = get_user_societe_id() AND get_user_role() IN (''GERANT'', ''ADMIN''))', t);
    END LOOP;
END $$;

-- 8.3 LIVREUR Policies

-- SELECT clients: only clients in their zone
CREATE POLICY "Livreur view clients in their zone" ON clients
    FOR SELECT TO authenticated
    USING (
        get_user_role() = 'LIVREUR'
        AND zone_id = (SELECT zone_id FROM utilisateurs WHERE id = auth.uid())
        AND societe_id = get_user_societe_id()
    );

-- SELECT commandes: only assigned to them
CREATE POLICY "Livreur view assigned orders" ON commandes
    FOR SELECT TO authenticated
    USING (
        get_user_role() = 'LIVREUR'
        AND livreur_assigne_id = auth.uid()
        AND societe_id = get_user_societe_id()
    );

-- UPDATE commandes: only assigned + business lock
CREATE POLICY "Livreur update assigned orders in delivery" ON commandes
    FOR UPDATE TO authenticated
    USING (
        get_user_role() = 'LIVREUR'
        AND livreur_assigne_id = auth.uid()
        AND statut = 'EN_LIVRAISON'
        AND societe_id = get_user_societe_id()
    )
    WITH CHECK (
        get_user_role() = 'LIVREUR'
        AND livreur_assigne_id = auth.uid()
        AND statut IN ('EN_LIVRAISON', 'LIVRE_PAYE', 'LIVRE_DETTE')
        AND societe_id = get_user_societe_id()
    );

-- INSERT recouvrements: only their own
CREATE POLICY "Livreur insert their own recouvrements" ON recouvrements
    FOR INSERT TO authenticated
    WITH CHECK (
        get_user_role() = 'LIVREUR'
        AND livreur_id = auth.uid()
        AND societe_id = get_user_societe_id()
    );

-- SELECT recouvrements: only their own
CREATE POLICY "Livreur view their own recouvrements" ON recouvrements
    FOR SELECT TO authenticated
    USING (
        get_user_role() = 'LIVREUR'
        AND livreur_id = auth.uid()
        AND societe_id = get_user_societe_id()
    );

-- SELECT produits: all products of their societe
CREATE POLICY "Livreur view products of their societe" ON produits
    FOR SELECT TO authenticated
    USING (
        get_user_role() = 'LIVREUR'
        AND societe_id = get_user_societe_id()
    );

-- SELECT zones/type_pdv: read only for their societe
CREATE POLICY "Livreur view zones of their societe" ON zones
    FOR SELECT TO authenticated
    USING (societe_id = get_user_societe_id());

CREATE POLICY "Livreur view type_pdv of their societe" ON type_pdv
    FOR SELECT TO authenticated
    USING (societe_id = get_user_societe_id());

-- ==========================================
-- 9. INDEXES
-- ==========================================

-- Foreign Keys
CREATE INDEX idx_zones_societe ON zones(societe_id);
CREATE INDEX idx_type_pdv_societe ON type_pdv(societe_id);
CREATE INDEX idx_utilisateurs_societe ON utilisateurs(societe_id);
CREATE INDEX idx_utilisateurs_zone ON utilisateurs(zone_id);
CREATE INDEX idx_clients_societe ON clients(societe_id);
CREATE INDEX idx_clients_zone ON clients(zone_id);
CREATE INDEX idx_produits_societe ON produits(societe_id);
CREATE INDEX idx_commandes_societe ON commandes(societe_id);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_livreur ON commandes(livreur_assigne_id);
CREATE INDEX idx_lignes_commande_commande ON lignes_commande(commande_id);
CREATE INDEX idx_lignes_commande_produit ON lignes_commande(produit_id);
CREATE INDEX idx_encaissements_commande ON encaissements(commande_id);
CREATE INDEX idx_recouvrements_commande ON recouvrements(commande_id);
CREATE INDEX idx_recouvrements_livreur ON recouvrements(livreur_id);
CREATE INDEX idx_preparations_commande_commande ON preparations_commande(commande_id);

-- Performance & Business logic
CREATE INDEX idx_commandes_statut_societe ON commandes(societe_id, statut);
CREATE INDEX idx_commandes_livreur_date ON commandes(livreur_assigne_id, date_livraison);
CREATE INDEX idx_commandes_date_livraison ON commandes(date_livraison);
CREATE INDEX idx_recouvrements_date ON recouvrements(commande_id, date_recouvrement);

-- ==========================================
-- 10. COMMENTS
-- ==========================================
COMMENT ON TABLE societes IS 'Root table for multi-tenant isolation.';
COMMENT ON TABLE utilisateurs IS 'Extended user profile linked to auth.users.';
COMMENT ON COLUMN utilisateurs.code_livreur IS 'Unique code assigned to delivery drivers.';
COMMENT ON TABLE clients IS 'Points of Sale (PDV) registered in the system.';
COMMENT ON COLUMN clients.telephone IS 'Normalized telephone number (+261 format).';
COMMENT ON TABLE commandes IS 'Main table for client orders and their lifecycle.';
COMMENT ON COLUMN commandes.statut IS 'Workflow status: EN_ATTENTE -> PREPARATION -> EN_LIVRAISON -> LIVRE_PAYE/DETTE.';
COMMENT ON TABLE encaissements IS 'Financial snapshot of an order delivery.';
COMMENT ON COLUMN encaissements.dette IS 'Remaining amount to be paid for this specific order.';
COMMENT ON TABLE recouvrements IS 'Payments made later to settle debts from past orders.';
