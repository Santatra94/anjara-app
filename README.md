# Anjara - Gestion Commerciale

Application de gestion pour la production et distribution de yaourts et jus (Anjara).

## 🚀 Fonctionnalités implémentées

### 🏗️ Infrastructure & UI
- **Next.js 14 (App Router)** & **Supabase SSR**
- **shadcn/ui** pour les composants d'interface
- **Authentification & RLS** : Isolation multi-tenant par `societe_id`
- **DashboardShell** : Layout avec Sidebar responsive et protection des routes

### ⚙️ Modules de Configuration
- **Zones** (`/zones`) : Gestion des secteurs géographiques de livraison.
- **Types de PDV** (`/types-pdv`) : Catégorisation des points de vente.
- **Produits** (`/produits`) : Catalogue avec prix de vente/achat et alertes de stock.
- **Clients** (`/clients`) : Gestion des points de vente (PDV) avec localisation.
- **Livreurs** (`/livreurs`) : Gestion des comptes livreurs (Auth + Profil) via Server Actions.

## 🛠️ Installation

1. Cloner le repo
2. Installer les dépendances : `npm install`
3. Configurer les variables d'environnement dans `.env.local` (voir `.env.local.example`)
4. Lancer le serveur : `npm run dev`

## 🧪 Qualité du code
- **Linting** : `npm run lint`
- **Build** : `npm run build`
- **Types** : TypeScript strict

## 📦 Stack Technique
- **Framework** : Next.js 14
- **Base de données/Auth** : Supabase
- **Formulaires** : React Hook Form + Zod
- **Style** : Tailwind CSS + Lucide Icons
