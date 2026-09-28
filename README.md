# SCAN Parrainage — Promo 69-70

Application de matching parrain/marraine — bizut pour la filière SCAN de l'INSA Lyon.

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **@dnd-kit** (drag & drop accessible)
- **react-pdf** (lecteur PDF intégré)
- **Netlify** (hébergement gratuit)

## Fonctionnalités
- Connexion directe sans mot de passe ni rate limit (choix de profil ou saisie nom/prénom/email)
- Upload et consultation de questionnaires PDF
- Drag & drop pour classer son top 3 bizuts
- Stats temps réel : nombre de votes par position pour chaque bizut
- Panel admin avec récapitulatif et algorithme de matching
- Sync temps réel entre toutes les sessions

---

## PARTIE 1 — SUPABASE (Base de données)

### 1.1 Créer le projet
1. Va sur [supabase.com](https://supabase.com) → Sign up (compte gratuit)
2. Clique **"New project"**
3. Donne un nom (ex: `scan-parrainage`) → Create
4. Attends que le projet soit prêt (~2 min)

### 1.2 Créer les tables (SQL)
1. Va dans **SQL Editor** (menu de gauche)
2. Clique **"New query"**
3. Copie-colle le contenu du fichier `supabase/migrations/001_init.sql`
4. Clique **"Run"**

### 1.3 Activer Realtime (sync temps réel)
1. Va dans **Database → Publications** (menu de gauche)
2. Tu verras `supabase_realtime` → clique dessus
3. Coche la table **"classements"** → Save

### 1.4 Créer le bucket Storage (PDF)
1. Va dans **Storage** (menu de gauche)
2. Clique **"New bucket"**
3. Nom : `questionnaires`
4. Coche **"Public bucket"** → Save

---

## PARTIE 2 — DÉPLOIEMENT VERCEL

### 2.1 Connecter Vercel
1. Va sur [vercel.com](https://vercel.com) → Sign up / Log in avec ton compte GitHub
2. Clique **"Add New..." → "Project"**
3. Importe le repo **`scan-parrainnage`**

### 2.2 Configurer les variables d'environnement
Dans la section **Environment Variables**, ajoute ces 2 variables :

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xupmycfricsqoltehzmw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_UEeXg4MsWaiVBuqLyWzlCA_EVxezjGO` |

### 2.3 Déployer
1. Clique sur **"Deploy"**
2. Vercel détecte automatiquement Next.js 14 et compile en ~30 secondes.
3. Ton site est live ! 🎉

---

## PARTIE 3 — PREMIER UTILISATION

### 3.1 Ajouter un admin
1. Va sur ton site Netlify
2. Inscris-toi avec ton email INSA
3. Va dans Supabase → **SQL Editor**
4. Exécute :
```sql
UPDATE parrains SET is_admin = true WHERE email = 'ton.email@insa-lyon.fr';
```

### 3.2 Ajouter les bizuts
1. Va dans Supabase → **Table Editor → bizuts**
2. Clique **"Insert row"**
3. Remplis : prenom, nom, pdf_url (URL du PDF uploadé dans Storage)
4. Répète pour chaque bizut

### 3.3 Les 2A se connectent
1. Ils vont sur le site
2. Rentrent nom/prénom/email INSA (ou sélectionnent leur nom s'ils sont déjà enregistrés)
3. Accèdent immédiatement à l'interface sans restriction de rate-limit
4. Classent leur top 3 en drag & drop
5. Les stats se mettent à jour en temps réel

---

## PARTIE 4 — UTILISATION ADMIN

1. Va sur `/admin/` (bouton en haut à droite si admin)
2. Tableau récap + stats globales + bouton **"Lancer le matching"**

---

## Structure
```
├── package.json
├── netlify.toml
├── postcss.config.js
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
├── supabase/
│   └── migrations/
│       └── 001_init.sql
└── src/
    ├── types/
    │   └── index.ts
    ├── lib/
    │   └── supabase.ts
    ├── components/
    │   ├── BizutCard.tsx
    │   ├── RankingBoard.tsx
    │   ├── PdfViewer.tsx
    │   └── StatsPanel.tsx
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx            # Login
        ├── ranking/
        │   └── page.tsx        # Interface 2A
        └── admin/
            └── page.tsx        # Panel admin
```
