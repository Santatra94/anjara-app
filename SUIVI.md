# 📊 Anjara — Suivi du projet

> Document maintenu à jour pour ne jamais perdre le contexte entre les sessions.
> Chaque jour de travail = nouvelle section datée.

---

## 🎯 Vision produit

**Anjara** = ERP mobile-first pour gestion de tournée commerciale (yaourts + jus) à Madagascar.

- **Multi-tenant** : plusieurs sociétés isolées
- **3 rôles** : ADMIN, GERANT, LIVREUR
- **Workflow** : Commande → Préparation → Livraison → Recouvrement

---

## 🛠️ Stack technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Storage)
- **PWA** : next-pwa + service worker
- **Hébergement** : Vercel — https://anjara-app.vercel.app
- **Repo** : https://github.com/Santatra94/anjara-app

---

## 📊 État actuel (12/07/2026)

### ✅ Fonctionnalités opérationnelles

**Authentification & Multi-tenant**
- Login/logout Supabase Auth
- Isolation par societe_id (RLS)
- AuthProvider Context (performance)

**Configuration (ADMIN/GERANT)**
- Zones, Types PDV, Produits, Clients, Livreurs
- CRUD complet + soft delete

**Workflow commande**
- Création commande (ADMIN + LIVREUR)
- Préparation détaillée (ADMIN + LIVREUR)
- Livraison + encaissement
- Recouvrement avec promesses cycliques

**Interface LIVREUR mobile**
- PWA installable
- Ma tournée du jour (Préparations, Livraisons, Recouvrements)
- Drag-and-drop pour réordonner
- FAB "+" pour nouvelle commande
- Caisse temps réel
- Historique
- Bottom navigation

**Sécurité**
- 4 modes de paiement (Espèces, Mvola, Orange, Airtel)
- Numéros téléphone normalisés (+261)
- Codes auto-générés (COM-XXXX, CLT001, etc.)
- Soft delete uniquement

---

## 📅 Journal de travail

# 📊 Anjara — Suivi du projet

> Document maintenu à jour pour ne jamais perdre le contexte entre les sessions.

---

## 🎯 Vision produit

**Anjara** = ERP mobile-first pour gestion de tournée commerciale (yaourts + jus) à Madagascar.

- **Multi-tenant** : plusieurs sociétés isolées (1 GERANT = 1 société = 1 business)
- **3 rôles** : ADMIN (Santatra, unique), GERANT (patron d'un business), LIVREUR (employé)
- **Workflow** : Commande → Préparation → Livraison → Recouvrement

---

## 🛠️ Stack technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Storage)
- **PWA** : next-pwa + service worker
- **Hébergement** : Vercel — https://anjara-app.vercel.app
- **Repo** : https://github.com/Santatra94/anjara-app

---

## 📊 État actuel (16/07/2026 - fin de session)

### ✅ Fonctionnalités opérationnelles

**Authentification & Multi-tenant**
- Login/logout Supabase Auth
- Isolation par societe_id (RLS)
- AuthProvider Context
- **Invitation email GERANT** (par ADMIN)
- **Invitation email LIVREUR** (par GERANT ou ADMIN)
- **Reset password GERANT/LIVREUR** avec email
- Page `/definir-mot-de-passe` qui gère invitation + reset (extraction fragment URL)

**Gestion multi-business (ADMIN uniquement)**
- Créer un business = créer une société + inviter un GERANT par email
- Chaque GERANT gère sa propre société isolée
- Bouton reset password pour chaque GERANT
- Suppression GERANT + suppression Auth (email réutilisable)

**Configuration (ADMIN/GERANT)**
- Zones, Types PDV, Produits, Clients, Livreurs
- Matières premières configurables
- CRUD complet + soft delete

**Workflow commande**
- Création commande (ADMIN + LIVREUR)
- Préparation détaillée
- Livraison + encaissement
- Recouvrement cyclique

**Interface LIVREUR mobile**
- PWA installable
- Tournée du jour drag-and-drop
- FAB "+" nouvelle commande
- Caisse temps réel
- Historique
- Bottom navigation

**Module Dépenses**
- 8 catégories (MATIERES_PREMIERES, SALAIRES, TRANSPORT, LOYER, MARKETING, CHARBON, ELECTRICITE, AUTRES)
- Champ quantité + prix unitaire avec calcul auto bidirectionnel
- Choix obligatoire d'une matière première pour MATIERES_PREMIERES
- Blocage GERANT : modif/suppression jour même uniquement
- Filtres période + catégorie

**Module Finance**
- Solde global depuis le début (Encaissements + Recouvrements + Injections − Retraits − Dépenses)
- Bénéfice net (Marge brute − Dépenses hors matières)
- Injections / Retraits d'argent
- Graphique CA vs Dépenses sur 6 mois
- Répartition dépenses par catégorie
- Bénéfice par produit (basé sur prix_achat)
- Blocage GERANT UI + API

**Sécurité**
- 4 modes de paiement
- Numéros téléphone normalisés (+261)
- Codes auto-générés
- Soft delete uniquement
- Variable env `SUPABASE_SERVICE_ROLE_KEY` pour invitation email

---

## 📅 Journal de travail

### 16/07/2026 — Session marathon Dépenses + Finance + Multi-business

**Durée** : ~7h

**Module Dépenses complet**
- Table `depenses` + RLS + triggers
- API CRUD
- Hook useDepenses
- Page mobile + desktop
- Table `matieres_premieres` + gestion
- Champs quantité + prix unitaire calcul auto
- Blocage GERANT jour même
- Contrainte libelle rendue nullable

**Module Finance complet**
- Table `mouvements_caisse` (INJECTION/RETRAIT)
- API `/api/finance` avec calculs complexes
- Page complète : solde, bénéfice, graphique, répartition, bénéfice par produit
- Blocage GERANT UI (icône désactivée)

**Multi-tenant Business**
- Fonctions SQL `fn_create_societe_avec_gerant`, `fn_create_livreur_dans_societe`
- API `/api/gerants` avec Supabase Admin (invitation email)
- Page `/gerants` réservée ADMIN
- Fix RLS : ADMIN doit bypass RLS pour voir tous les GERANTS (service_role)
- Suppression GERANT supprime aussi le compte Auth

**Système d'invitation email**
- Livreur `actions.ts` refait : `inviteUserByEmail` au lieu de `createUser`
- Retrait du champ password du formulaire livreur
- Schema Zod : email obligatoire, plus de password
- Bouton "Reset password" sur /livreurs (KeyRound ambre)
- Bouton "Reset password" sur /gerants (KeyRound ambre)
- Action `resetPasswordLivreurAction`
- API PATCH sur /api/gerants pour reset password

**Page `/definir-mot-de-passe`**
- Nouvelle page qui gère à la fois invitation initiale + reset password
- Extraction manuelle des tokens depuis le fragment URL (#access_token=...)
- `setSession` explicite avec access_token + refresh_token
- Nettoyage de l'URL après session établie
- Formulaire nouveau mot de passe + confirmation

**Fix middleware**
- Ajout `/definir-mot-de-passe` dans les routes publiques
- Sinon le middleware bloquait la page et redirigeait vers /login

**Navigation**
- Ajout Finance + Dépenses + Gérants dans Sidebar
- Ajout Finance + Dépenses + Gérants dans BottomNavAdmin
- Lien "Gérants" masqué pour role GERANT (adminOnly filter)
- Fetch role côté client pour filtrer les liens

**Bugs corrigés en cours**
- SWC parser sensible aux caractères Unicode et sauts de ligne manquants
- Supabase join produits retournait un tableau → helper `extractProduit`
- Fonctions dans try block (strict mode) → arrow functions
- Contrainte NOT NULL sur libelle depenses → nullable
- RLS bloquait ADMIN de voir GERANTS des autres sociétés → service_role
- Fragment URL non détecté → extraction manuelle + setSession

**Configuration Supabase**
- Site URL : `https://anjara-app.vercel.app`
- Redirect URLs : `/**` + `/definir-mot-de-passe`
- SMTP par défaut Supabase (limite ~4 emails/heure — suffisant pour tester)

**Variables env Vercel**
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `NEXT_PUBLIC_APP_URL` (optionnel, fallback en dur si absent)

---

### 15/07/2026 — Bottom sheets + Mode livreur ADMIN/GERANT

- MobileSheet wrapper
- 5 modales converties en bottom sheets
- Header mobile compact
- Layout (livreur) accepte 3 rôles
- Hook `useTourneeAdmin`
- Page `/tournee-admin`
- Boutons Livrer/Recouvrer dans CommandesList

---

### 14/07/2026 — Interface mobile ADMIN/GERANT

- BottomNavAdmin
- Menu "Plus" drawer
- 6 pages transformées en cards mobiles

---

### 13/07/2026 — Dashboards (PROMPT 6)

- Dashboard ADMIN/GERANT
- Dashboard LIVREUR mobile
- Icônes PWA
- Préparation intelligente

---

### 12/07/2026 — Session marathon (bugs + features livreur)

- Fix routing LIVREUR + trigger SQL + RLS
- Création commande par LIVREUR
- Trigger assignation intelligent
- AuthProvider Context

---

## 🔜 TODO Prochaine session

### 🥇 Priorité 1 — Impersonation ADMIN
**"Comment ADMIN peut entrer dans quelle société"**
- Sélecteur "Voir en tant que..." dans header ADMIN
- OU page `/admin/societes` avec bouton "Entrer dans ce business"
- Cookie `impersonate_societe_id` respecté par l'API
- Permet à l'ADMIN de faire du support / debug sur chaque business

### 🥈 Priorité 2 — Module Stock (PROMPT 8)
- Table `mouvements_stock`
- Interface production
- Stock ingrédients + produits finis
- Alerte stock faible

### 🥉 Priorité 3 — Module Recettes (PROMPT 9)
- Table `recettes` par produit
- Calcul coût de revient dynamique
- Marge par produit basée sur matières premières récentes
- Optimiseur distribution parfums

### 🏅 Priorité 4 — Améliorations
- Notifications intelligentes
- Rapports PDF/Excel
- Audit trail UI

---

## 🐛 Bugs connus non-bloquants

- Vitesse navigation (~1-2s après action)
- Pas d'affichage temps réel dette dans formulaire recouvrement
- Fragment URL parfois cassé sur WebView Gmail mobile (workaround : copier lien dans navigateur normal)

---

## 📁 Architecture des fichiers

### 15/07/2026 — TODO C + TODO D (Bottom sheets + Mode livreur ADMIN/GERANT)

**TODO C — Améliorations mobile**
- ✅ **MobileSheet wrapper** créé (`src/components/ui/mobile-sheet.tsx`)
  - Mobile (<md) : glisse depuis le bas, handle gris, rounded-top
  - Desktop : Dialog classique centré
  - Basé sur Radix Dialog primitives
- ✅ **5 modales converties** en bottom sheets sur mobile :
  - ClientFormModal
  - LivreurFormModal
  - ProduitFormModal
  - ZoneFormModal
  - TypePdvFormModal
- ✅ **Header mobile compact** (h-12 md:h-16, padding réduit, logo/texte plus petits)

**TODO D — ADMIN/GERANT peut effectuer des livraisons**
- ✅ **Layout (livreur)** accepte ADMIN + GERANT (plus juste LIVREUR)
- ✅ **LivreurShell adapté** pour ADMIN/GERANT :
  - Badge "Mode livreur" bleu
  - Bouton "Retour" vers Dashboard (au lieu de logo ANJARA)
  - Pas de BottomNav livreur ni de FAB (pour ne pas polluer l'UX admin)
- ✅ **Hook `useTourneeAdmin`** créé (accepte un `livreurId` en paramètre)
  - Fetch la liste des utilisateurs (LIVREUR + ADMIN + GERANT)
  - Fetch la tournée du livreur sélectionné
- ✅ **Page `/tournee-admin`** créée (dashboard)
  - Dropdown "Choisir un livreur" (inclut ADMIN + GERANT)
  - Affichage tournée du livreur choisi (Préparations/Livraisons/Recouvrements)
  - Réutilise les composants CartePreparation, CarteLivraison, CarteRecouvrement
- ✅ **Bouton "Tournée du jour"** ajouté dans menu Plus du BottomNavAdmin
- ✅ **Boutons Livrer/Recouvrer** dans CommandesList (mobile + desktop)
  - EN_LIVRAISON → bouton "Livrer" (vert) → /livraison/[id]
  - LIVRE_DETTE → bouton "Recouvrer" (ambre) → /recouvrement/[id]
- ✅ **`useLivreurs` étendu** pour inclure ADMIN + GERANT (au lieu de juste LIVREUR)

**Fichiers créés**
- `src/components/ui/mobile-sheet.tsx`
- `src/hooks/useTourneeAdmin.ts`
- `src/app/(dashboard)/tournee-admin/page.tsx`

**Fichiers modifiés**
- `src/components/modules/ClientFormModal.tsx`
- `src/components/modules/LivreurFormModal.tsx`
- `src/components/modules/ProduitFormModal.tsx`
- `src/components/modules/ZoneFormModal.tsx`
- `src/components/modules/TypePdvFormModal.tsx`
- `src/components/layout/Header.tsx` (compact mobile)
- `src/components/layout/BottomNavAdmin.tsx` (+ Tournée du jour)
- `src/components/livreur/LivreurShell.tsx` (badge Mode livreur)
- `src/app/(livreur)/layout.tsx` (accepte 3 rôles)
- `src/components/commandes/CommandesList.tsx` (boutons actions)
- `src/hooks/useLivreurs.ts` (3 rôles)

**Bugs découverts / à corriger**
- ⚠️ **Modal "Réassigner le livreur"** dans CommandeDetailView ne montre PAS
  encore ADMIN/GERANT — il utilise probablement une autre requête directe
  ou un autre hook que `useLivreurs`. À investiguer prochaine session.
- ⚠️ SWC : erreur type sur statut 'PRETE' (n'existe pas dans l'enum SQL)
  → correction : utiliser 'EN_LIVRAISON' à la place

**Durée** : ~2h30

### 14/07/2026 — Interface mobile ADMIN/GERANT

**Réalisations**
- ✅ **BottomNavAdmin** créé (Dashboard / Commandes / Clients / Livreurs / Plus)
- ✅ **Menu "Plus"** avec Produits / Zones / Types PDV / Déconnexion (drawer bas)
- ✅ **Sidebar cachée sur mobile** (hidden md:flex)
- ✅ **6 pages transformées en cards mobiles** (tableau conservé desktop) :
  - Commandes (avec badges statut + boutons Voir/Préparer)
  - Clients (téléphone cliquable, avatar type PDV)
  - Livreurs (avatar bleu, email/tel cliquables)
  - Produits (avatar coloré par catégorie YAOURT/JUS)
  - Zones (compact, icône MapPin)
  - Types PDV (compact, icône Store)
- ✅ **Titres responsive** (text-xl md:text-2xl)
- ✅ **Boutons "Ajouter" pleine largeur** sur mobile

**Fichiers créés**
- `src/components/layout/BottomNavAdmin.tsx`

**Fichiers modifiés**
- `src/components/layout/DashboardShell.tsx` (intégration BottomNav)
- `src/components/layout/Sidebar.tsx` (hidden md:flex)
- `src/components/commandes/CommandesList.tsx` (double vue)
- `src/app/(dashboard)/clients/page.tsx` (double vue)
- `src/app/(dashboard)/livreurs/page.tsx` (double vue)
- `src/app/(dashboard)/produits/page.tsx` (double vue)
- `src/app/(dashboard)/zones/page.tsx` (double vue)
- `src/app/(dashboard)/types-pdv/page.tsx` (double vue)

**TODO enregistrés pour plus tard**
- ⚠️ Modales création → bottom sheets sur mobile
- ⚠️ Header mobile compact
- ⚠️ ADMIN/GERANT peut effectuer des livraisons (comme LIVREUR)

**Durée** : ~2h30

### 13/07/2026 — Session Dashboards + Améliorations (PROMPT 6)

**Réalisations majeures**
- ✅ **Dashboard ADMIN/GERANT complet** (`/`)
  - CA de la période avec filtres (Aujourd'hui / Ce mois / Mois précédent)
  - Cards stats (CA, commandes, dette, clients)
  - Graphique CA sur 30 jours (Recharts, courbe smooth)
  - Tableau performance livreurs
  - Top 5 clients par dette
- ✅ **Dashboard LIVREUR mobile** (`/dashboard`)
  - Caisse du jour à reverser (card dégradé)
  - Livrées vs restantes
  - Dettes en cours
  - Clients visités aujourd'hui
  - Préparations/Livraisons/Recouvrements
- ✅ **Bouton Dashboard dans BottomNav livreur**
- ✅ **Redirection LIVREUR /** → **/dashboard** au login
- ✅ **Icônes PWA** (icon-192.png + icon-512.png uploadées)

**Améliorations**
- ✅ **Préparation commande — suggestions intelligentes** :
  - Extraction automatique des parfums de la commande
  - Suggestions modifiables (dropdown produit + qté)
  - Bouton unique "Ajouter tous les produits saisis"
  - Preview temps réel dans les barres de progression
  - Formulaire libre exclut les produits déjà suggérés
- ✅ **Trigger SQL `date_livraison_effective`** créé
  - Fonction `fn_set_date_livraison_effective()`
  - Trigger BEFORE UPDATE sur commandes
  - Rattrapage des données existantes (toutes les commandes NULL)

**Fichiers créés**
- `src/types/dashboard.ts`
- `src/components/dashboard/StatCard.tsx`
- `src/components/dashboard/GraphiqueCA.tsx`
- `src/app/api/dashboard/admin/route.ts`
- `src/app/api/dashboard/livreur/route.ts`
- `src/app/(dashboard)/page.tsx` (remplacé)
- `public/icon-192.png` + `public/icon-512.png`

**Fichiers modifiés**
- `src/components/livreur/BottomNav.tsx` (+ Dashboard)
- `src/app/(dashboard)/layout.tsx` (redirect livreur)
- `src/components/commandes/PreparationInterface.tsx` (suggestions)
- `package.json` (recharts ajouté)

**Bugs corrigés**
- Filtre timestamp `date_encaissement` (ajout T00:00:00 / T23:59:59)
- Table `utilisateurs` (pas `profils`)
- Comptage livraisons via `date_livraison_effective` (avec trigger correct)

**Bugs découverts documentés**
- ⚠️ SWC parser Next.js 14 sensible aux :
  - Caractères Unicode dans commentaires (`──`, accents)
  - Ternaires imbriqués dans className
  - Syntaxe Tailwind arbitraire complexe (`shadow-[0_-1px_10px_rgba...]`)
  - **Règle** : préférer helpers séparés + éviter accents dans les strings

**Durée** : ~6h (avec debug SWC + refonte préparation)

---

## 🔜 TODO Prochaine session

### 🥇 Priorité 1 — Interface mobile ADMIN/GERANT (~4-5h)
- Refonte DashboardShell (sidebar → drawer)
- Nouveau BottomNav pour ADMIN
- Tableaux → cards mobiles
- Modales → bottom sheets

### 🥈 Priorité 2 — PROMPT 7 : Module Dépenses (~3h)
- Table `depenses` avec catégories
- CRUD ADMIN/GERANT
- Onglet Finance : CA - Dépenses = Bénéfice

### 🥉 Priorité 3 — PROMPT 8 : Module Stock (~4h)
- Table `mouvements_stock`
- Interface production
- Alertes stock faible

### 12/07/2026 — Session marathon (15h → 21h)

**Bugs critiques résolus**
- ✅ Fix routing LIVREUR : création page `/tournee` + redirections layouts
- ✅ Fix SQL trigger `uuid_generate_v4()` → `gen_random_uuid()`
- ✅ Fix trigger auto-passage LIVRE_DETTE au moindre INSERT
- ✅ Fix RLS multi-tenant pour LIVREUR (INSERT recouvrements, préparations)
- ✅ Fix vue `v_tournee_du_jour` avec dette temps réel

**Améliorations UX**
- ✅ Dates par défaut J+7 → J+2 (livraison + recouvrement)
- ✅ Redirection directe `/tournee` après action (au lieu de `/`)

**Nouvelles fonctionnalités**
- ✅ Création commande par LIVREUR (FAB flottant bleu)
- ✅ Préparation par LIVREUR (nouvelle tâche violette dans tournée)
- ✅ Trigger assignation livreur intelligent (LIVREUR + livraison J = auto-assigné)
- ✅ Réassignation livreur par ADMIN/GERANT (modal sur détail commande)

**Performance**
- ✅ AuthProvider Context (évite refetch du user à chaque page)
- ✅ Redirections optimisées

---

## 🔥 TODO PRIORITAIRE (à faire ensuite)

### Haute priorité
- [ ] **Upload icônes PWA** (icon-192.png + icon-512.png dans /public)
- [ ] Test workflow complet en usage réel (créer → préparer → livrer → recouvrer)
- [ ] Créer plusieurs livreurs test pour valider l'assignation par zone

### Moyenne priorité (PROMPT 6)
- [ ] **Dashboards** ADMIN/GERANT/LIVREUR
  - Utiliser vues existantes (v_clients_dettes, v_performance_livreurs, etc.)
  - Filtres : Aujourd'hui / Ce mois / Mois précédent / Personnalisé
  - Graphiques (Recharts)

### Optimisations vitesse
- [ ] Optimistic UI après actions (afficher résultat avant réponse serveur)
- [ ] Précharger les données de tournée
- [ ] Vérifier config service worker (pas actif en dev)

---

## 🟡 TODO MOYEN TERME

- [ ] **Module Dépenses** (PROMPT 7)
  - Table `depenses` (catégories : matières premières, salaires, transport, loyer, etc.)
  - CRUD ADMIN + GERANT uniquement
  - Onglet "Finance" : CA - Dépenses = Bénéfice

- [ ] **Module Stock réel** (PROMPT 8)
  - Table `mouvements_stock`
  - Interface production
  - Stock ingrédients + produits finis
  - Alerte stock faible

- [ ] **Module Recettes** (PROMPT 9)
  - Table `recettes` par produit
  - Calcul coût de revient
  - Marge par produit
  - Optimiseur distribution parfums

---

## 🟢 TODO PLUS TARD (nice to have)

- [ ] Notifications intelligentes (dettes anciennes, stock faible)
- [ ] Rapports PDF/Excel exportables
- [ ] Audit trail UI (voir qui a modifié quoi)
- [ ] Historique modifications commandes

---

## 🐛 Bugs connus non-bloquants

- [ ] Vitesse de navigation reste améliorable (~1-2s après action)
- [ ] Pas d'affichage temps réel de la dette dans le formulaire recouvrement (affiche montant promesse initiale)

---

## 📁 Architecture des fichiers 
src/
├── app/
│ ├── (dashboard)/ # Routes ADMIN/GERANT
│ │ ├── layout.tsx # Redirect LIVREUR vers /tournee
│ │ ├── commandes/
│ │ ├── clients/
│ │ ├── livreurs/
│ │ ├── produits/
│ │ ├── types-pdv/
│ │ └── zones/
│ ├── (livreur)/ # Routes LIVREUR mobile
│ │ ├── layout.tsx # Redirect non-LIVREUR vers /
│ │ ├── tournee/ # Page principale
│ │ ├── nouvelle-commande/ # Créer une commande
│ │ ├── preparation/[id]/ # Préparer une commande
│ │ ├── livraison/[id]/ # Valider une livraison
│ │ ├── recouvrement/[id]/ # Encaisser une dette
│ │ ├── caisse/
│ │ ├── mes-clients/
│ │ └── historique/
│ ├── login/
│ └── layout.tsx # Wrappé avec AuthProvider
├── components/
│ ├── AuthProvider.tsx # Context React global
│ ├── ProtectedRoute.tsx
│ ├── commandes/ # UI commandes (ADMIN)
│ ├── layout/ # DashboardShell, Sidebar, Header
│ ├── livreur/ # Interface mobile LIVREUR
│ ├── modules/ # Modales CRUD
│ ├── shared/ # DatePicker
│ └── ui/ # shadcn/ui
├── hooks/ # Custom hooks
├── lib/
│ ├── schemas/ # Validations Zod
│ ├── supabase/ # Clients Supabase
│ └── utils.ts
└── types/
├── database.types.ts # Types Supabase générés
└── index.ts


---

## 🔑 Règles métier importantes

1. **Préparation ≤ Commande** : contrainte BDD (impossible de préparer plus que demandé)
2. **Commande figée après livraison** : LIVRE_PAYE/DETTE = pas modifiable
3. **Prix fixe** (pas de remise)
4. **1 livreur actif par zone** (contrainte unique BDD)
5. **Assignation intelligente** :
   - LIVREUR crée commande + livraison aujourd'hui → auto-assigné à lui-même
   - Sinon → livreur de la zone du client
6. **4 modes paiement** : ESPECES, MVOLA, ORANGE_MONEY, AIRTEL_MONEY
7. **Livreur ne peut PAS valider une livraison sans montant reçu**
8. **Si dette → date recouvrement obligatoire → réapparaît cycliquement**

---

## 👥 Équipe

- **Santatra** (@Santatra94) — Product Owner + Test
- **Jules** (Google AI) — Dev principal (à surveiller de près)
- **Claude** (Anthropic) — Architecture + Debug + Stratégie

---

## 📞 Contacts & Liens utiles

- **App prod** : https://anjara-app.vercel.app
- **Repo GitHub** : https://github.com/Santatra94/anjara-app
- **Vercel** : https://vercel.com/santatra950123/anjara-app/deployments
- **Supabase** : https://supabase.com/dashboard/project/hnlwdizspisvmxzyjjsc

---

## ⚠️ Règles de collaboration avec Jules

1. **Toujours vérifier sur GitHub** que le code est bien poussé (Jules annonce "fait" parfois sans commit)
2. **Le recadrer fermement** s'il divague
3. **JAMAIS modifier le SQL initial** `001_initial_schema.sql`
4. **Régénérer package-lock.json** après conflits (`npm install`)
5. **Utiliser Radix UI standard** (pas @base-ui/react)
6. **Types Supabase** : régénérés manuellement, collés par Santatra
7. **Multi-tenancy** : filtrer par `societe_id`
8. **Soft delete** : jamais DELETE, toujours `is_archived = true`
9. **Codes auto par BDD** : ne pas les envoyer depuis le front
10. **Audit auto via triggers** : ne pas envoyer created_by/updated_by

---

_Dernière mise à jour : 12/07/2026 — 21h00_
