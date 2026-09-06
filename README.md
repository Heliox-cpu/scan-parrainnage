# SCAN Parrainage — Promo 69-70

Application de matching parrain/marraine — bizut pour la filière SCAN de l'INSA Lyon.

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **@dnd-kit** (drag & drop accessible)
- **react-pdf** (lecteur PDF intégré)
- **Netlify** (hébergement gratuit)

## Fonctionnalités
- Auth par magic link (pas de mot de passe)
- Upload de questionnaires PDF
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

## PARTIE 2 — DÉPLOIEMENT NETLIFY

### 2.1 Push sur GitHub
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/TON_USER/scan-parrainage.git
git push -u origin main
```

### 2.2 Connecter Netlify
1. Va sur [netlify.com](https://netlify.com) → Sign up
2. Clique **"Add new site" → "Import an existing project"**
3. Sélectionne **GitHub** → choisis ton repo

### 2.3 Configurer le build
Netlify détecte automatiquement Next.js grâce au `package.json` à la racine.

Vérifie dans **Site settings → Build & deploy → Build settings** :
- **Build command** : `npm run build`
- **Publish directory** : `.next`

### 2.4 Ajouter les variables d'environnement
1. Va dans **Site settings → Environment variables**
2. Clique **"Add a variable"**
3. Ajoute ces 2 variables :

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xupmycfricsqoltehzmw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_UEeXg4MsWaiVBuqLyWzlCA_EVxezjGO` |

4. Clique **Save**

### 2.5 Déployer
1. Va dans **Deploys**
2. Clique **"Trigger deploy" → "Clear cache and deploy site"**
3. Attends le build (~2 min)
4. Ton site est live ! 🎉

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
2. Rentrent nom/prénom/email INSA
3. Reçoivent un lien magique par mail
4. Clasquent leur top 3 en drag & drop
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
