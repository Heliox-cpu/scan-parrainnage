# SCAN Parrainage — Promo 69-70

Application de matching parrain/marraine — bizut pour la filière SCAN de l'INSA Lyon.

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **@dnd-kit** (drag & drop accessible)
- **react-pdf** (lecteur PDF intégré)

## Fonctionnalités
- Auth par magic link (pas de mot de passe)
- Upload de questionnaires PDF
- Drag & drop pour classer son top 3 bizuts
- Stats temps réel : nombre de votes par position pour chaque bizut
- Panel admin avec récapitulatif et algorithme de matching
- Sync temps réel entre toutes les sessions

## Setup

### 1. Supabase
1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans SQL Editor → New query → colle le contenu de `supabase/migrations/001_init.sql`
3. Va dans Database → Replication → active Realtime sur `classements`
4. Va dans Storage → New bucket → `questionnaires` → Public
5. Récupère l'URL et la clé anon (Settings → API)

### 2. Local
```bash
npm install
# Copie .env.local.example → .env.local et remplis tes variables Supabase
npm run dev
```

### 3. Déploiement Netlify

#### Option A : CLI
```bash
# Installe le CLI Netlify
npm install -g netlify-cli

# Connecte-toi
netlify login

# Initialise le site
netlify init

# Déploie
netlify deploy --prod
```

#### Option B : Git (recommandé)
1. Push ce repo sur GitHub
2. Va sur [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project"
3. Sélectionne ton repo GitHub
4. Variables d'environnement à ajouter dans Netlify (Site settings → Environment variables) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Build settings (déjà configurés dans `netlify.toml`) :
   - Build command : `npm run build`
   - Publish directory : `.next`
6. Clique sur **Deploy**

> **Note** : Netlify détecte automatiquement Next.js et installe `@netlify/plugin-nextjs` pour le support SSR/Edge.

## Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Algorithme de matching (Admin)
Le panel admin inclut un bouton "Lancer le matching" qui utilise l'algorithme de Gale-Shapley (Stable Marriage) pour optimiser les attributions parrains↔bizuts.

## Structure
```
app/
  page.tsx          → Login / inscription
  ranking/page.tsx  → Interface de classement (2A)
  admin/page.tsx    → Panel admin
components/
  BizutCard.tsx     → Carte bizut draggable
  RankingBoard.tsx  → Zones de drop + liste
  PdfViewer.tsx     → Lecteur PDF modal
  StatsPanel.tsx    → Stats temps réel
```
