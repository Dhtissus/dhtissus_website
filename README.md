# DH TISSU — Site Web Haute Couture

Site vitrine premium pour **DH TISSU**, maison de tissus haute couture à Casablanca.

## Aperçu

- Design luxe minimaliste (crème, champagne, parme, doré)
- Typographie éditoriale Cormorant Garamond + Jost
- Animations cinématographiques et micro-interactions
- 100 % responsive mobile
- SEO optimisé pour le Maroc
- Prêt pour catalogue, e-commerce, WhatsApp, Instagram Shop, Meta Pixel et Google Analytics

## Sections

1. **Hero** — Diaporama immersif de matières nobles
2. **Identité** — Storytelling de la maison
3. **Collections** — 10 collections (Soie, Velours, Dentelle, Brocart, Satin, Organza, Mousseline, Perlés, Mariage, Caftan Royal)
4. **Expérience Client** — Accompagnement sur mesure
5. **Galerie Instagram** — Mur éditorial
6. **Témoignages** — Slider premium
7. **Rendez-vous** — Formulaire élégant
8. **Footer** — Contact, horaires, mentions légales
9. **WhatsApp flottant** — CTA conseiller haute couture

## Lancer le site localement

### Installation (première fois)

```bash
npm install
```

### Démarrer

```bash
npm start
```

Ou double-cliquez sur **`start.bat`**.

| Page | URL |
|------|-----|
| Site public | http://localhost:8080 |
| **Admin** | http://localhost:8080/admin |

> **Important :** n'ouvrez pas `index.html` directement. Utilisez le serveur local.

---

## Espace Admin + Supabase

L'admin permet de gérer produits, prix, collections et statistiques via **Supabase**.

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → **New project**
2. Notez l'URL et les clés API (**Settings → API**)

### 2. Créer les tables

Dans **Supabase Dashboard → SQL Editor**, exécutez le fichier :

```
supabase/schema.sql
```

### 3. Configurer `.env`

```bash
copy .env.example .env
```

Remplissez :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Importer les produits existants

```bash
npm run seed
```

Importe les ~104 produits depuis `js/products.js` vers Supabase.

### 5. Créer un compte admin

**Supabase Dashboard → Authentication → Users → Add user**

- Email : `admin@dhtissu.ma` (ou le vôtre)
- Password : votre mot de passe
- Cochez **Auto Confirm User**

### 6. Se connecter

1. `npm start`
2. Ouvrez **http://localhost:8080/admin**
3. Connectez-vous avec votre email / mot de passe

### Fonctionnalités admin

| Page | Actions |
|------|---------|
| **Tableau de bord** | Stats produits, stock, vues, clics WhatsApp |
| **Produits** | Ajouter, modifier, supprimer, changer prix inline |
| **Collections** | Gérer catégories (Soie, Velours, etc.) |
| **Paramètres** | Numéro WhatsApp |

Sans `.env` configuré, le site utilise le fichier `products.js` en fallback.

---

## Personnalisation

| Élément | Fichier | Action |
|---------|---------|--------|
| Numéro WhatsApp | Admin → Paramètres | Ou `index.html` si pas encore configuré |
| Instagram | `index.html` | Remplacer `@dhtissu` et les liens |
| Google Analytics | `index.html` | Décommenter le script et remplacer `GA_MEASUREMENT_ID` |
| Meta Pixel | `index.html` | Décommenter le script et remplacer `PIXEL_ID` |
| Images | `index.html` | Remplacer les URLs Unsplash par vos photos produits |
| Adresse showroom | `index.html` | Ajouter l'adresse complète Casablanca |

## SEO

Mots-clés ciblés :
- tissu haute couture Casablanca
- tissu mariage luxe Maroc
- tissu caftan Casablanca
- maison de tissu Casablanca

Fichiers inclus : `robots.txt`, `sitemap.xml`, Schema.org LocalBusiness, balises Open Graph.

## Évolutions futures

La structure est prête pour :
- Pages catalogue par collection (`/collections/soie`, etc.)
- Panier et checkout e-commerce
- Backend formulaire rendez-vous (Formspree, Netlify Forms, API custom)
- Intégration Instagram Shop API
- Blog éditorial mode / haute couture

## Déploiement

Compatible avec : Netlify, Vercel, GitHub Pages, hébergement mutualisé Maroc.

---

© 2026 DH TISSU — L'Excellence Textile, Depuis Casablanca
