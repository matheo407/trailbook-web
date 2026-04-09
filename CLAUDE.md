# TrailBook — Documentation technique

Application PWA de gestion de randonnées, construite avec Next.js 14 App Router, TypeScript, Tailwind CSS, IndexedDB (idb), Supabase et Leaflet.

---

## Stack technique

- **Framework** : Next.js 14 App Router, TypeScript
- **Style** : Tailwind CSS
- **Stockage local** : IndexedDB via `idb` (`src/lib/db.ts`)
- **Sync cloud** : Supabase (`src/lib/supabase.ts`, `src/lib/sync.ts`)
- **Cartes** : Leaflet + react-leaflet (import dynamique SSR disabled)
- **Déploiement** : Vercel via `npx vercel --prod` (le webhook git est cassé — le tag `Co-Authored-By: Claude` déclenche un `isBot` error côté Vercel)

---

## Architecture de données

### IndexedDB — `src/lib/db.ts`
- Version actuelle : **2** (bump à 2 pour l'ajout du store `gear_templates`)
- Stores : `hikes`, `companions`, `gear_items`, `stops`, `gear_templates`
- Migration automatique au chargement via `migrateHike()` :
  - `route: Coordinate[]` (ancien) → `routes: RouteSegment[]`
  - `photos: string[]` (ancien) → `photos: HikePhoto[]`
  - Champs manquants (`savedPois`, `tags`, `gear.quantity`) initialisés avec valeurs par défaut
- Fix iOS : callback `terminated()` sur `openDB` remet `dbInstance = null` si iOS coupe la connexion

### Sync Supabase — `src/lib/sync.ts`
- Écriture **debouncée** : les writes s'accumulent dans un `Map` et sont flushés en batch après 3s d'inactivité (évite la déplétion du Disk IO budget Supabase)
- `pushRow(table, obj)` : écriture locale immédiate + sync cloud différée
- `deleteRow(table, id)` : suppression immédiate cloud
- `pullFromCloud()` : full pull Supabase → IndexedDB (appelé en background après login)
- `pushToCloud()` : full push IndexedDB → Supabase (appelé après signup)

### Types — `src/types/index.ts`
- `HikePhoto` : `{ url: string; coordinate?: Coordinate; takenAt?: string }`
- `GearTemplate` : `{ id, name, gearIds[], createdAt }`
- `Hike.photos` : `HikePhoto[]` (migré depuis `string[]`)

---

## Fonctionnalités

### Randonnées (`src/app/randos/`)
- Liste des randos avec cartes (`HikeCard`) et filtres
- Création / édition : formulaire complet (nom, statut, date, distance, dénivelé, durée, difficulté, région, description, tags, compagnons, tracé GPX, points de départ/arrivée, photos, commentaires, notation)
- Statut toggle **Planifiée / Faite** directement sur la page detail
- Suppression avec confirmation

### Tracés GPX (`src/components/MultiRouteDrawer.tsx`, `src/components/RouteDrawer.tsx`)
- Import de fichiers `.gpx` (parsing via `src/lib/gpx.ts`)
- Dessin manuel sur carte
- Multi-segments supportés (`routes: RouteSegment[]`)
- Export GPX enrichi (`exportHikeGPX`) : inclut les tracés + les arrêts géolocalisés comme waypoints

### Carte et localisation (`src/app/carte/`, `src/components/RouteMap.tsx`, `src/components/RouteMapInner.tsx`)
- Carte globale (`/carte`) : affiche toutes les randos avec leurs tracés, auto-fit bounds
- Carte par rando : affiche tracés + marqueurs d'arrêts
- **Bouton "Me localiser"** : `getCurrentPosition` one-shot → point bleu sur la carte
- **Bandeau GPS info** (après localisation) : distance + dénivelé positif/négatif vers le prochain arrêt, calculés en suivant le tracé (projection sur le track via haversine, `computeTrailInfo` dans `src/lib/utils.ts`). Alerte si >300m hors tracé.

### Planification (`src/app/randos/[id]/plan/`)
- Onglet **Étapes** : création/édition/suppression/réordonnancement d'arrêts, placement sur carte via `StopMapPickerInner`
- Onglet **Matériel** : grille photo 3 colonnes, tap pour sélectionner/désélectionner, quantité ajustable, poids total calculé, bouton "Appliquer un template"
- Onglet **Checklist** : liste des articles sélectionnés avec cases à cocher, persistée dans `localStorage` (clé `checklist-{hikeId}`)
- **Templates matériel** : créés dans `/materiel`, appliqués d'un tap dans Planifier

### Matériel (`src/app/materiel/`)
- CRUD complet : nom, catégorie, poids, notes, photo
- Filtres par catégorie
- **Templates** : bouton "Templates" dans le header → modal pour créer/supprimer des listes prédéfinies (nom + sélection d'articles)
- Stockés dans `gear_templates` (IndexedDB + Supabase)

### Photos géolocalisées
- Upload via `PhotoUpload` (`src/components/PhotoUpload.tsx`)
- **Priorité 1** : lecture des métadonnées EXIF GPS de la photo (via `exifr`) → coordonnée exacte du lieu de prise de vue
- **Priorité 2** : fallback sur `getCurrentPosition` au moment de l'upload
- Miniature avec icône 📍 si coordonnée présente
- Album dans la page detail de la rando

### Partage (`src/app/share/`)
- Bouton "Partager" → génère un lien `/share?d=<compressed>`
- Données compressées via `lz-string` (`compressToEncodedURIComponent`)
- La trace GPS est downsampée (1 point/3) pour alléger l'URL
- Sur iOS/Android : share sheet natif (`navigator.share`)
- Sur desktop : copie dans le presse-papier
- Page `/share` : lisible par n'importe qui sans compte (carte avec tracé, étapes, compagnons, POIs)
- Bouton "Ajouter à mes randos" : importe la rando dans l'IndexedDB local
- Rétrocompatible avec les anciens liens base64

### Points d'intérêt (`src/app/randos/[id]/pois/`)
- Recherche via Overpass API (`src/lib/overpass.ts`)
- Sauvegarde de POIs sur la rando

### Stats (`src/app/stats/`)
- Calculs à partir des randos locales : total distance, dénivelé, durée, répartition par difficulté, etc.

### Timeline (`src/app/timeline/`)
- Randos groupées par année avec photos

### Authentification (`src/app/auth/`)
- Login/signup Supabase
- Timeout 20s avec message d'erreur explicite
- Redirect immédiat après login, sync en background (`pullFromCloud()`)

### Sauvegarde (`src/app/sauvegarde/`)
- Export JSON complet de toutes les données (hikes, companions, gear, stops, templates)
- Import JSON pour restaurer

---

## Hooks

- `useHikes` — CRUD randos + sync
- `useStops` — CRUD arrêts + réordonnancement
- `useGear` — CRUD matériel + sync
- `useCompanions` — CRUD compagnons + sync
- `useAuth` — login/signup/logout Supabase

---

## Points d'attention

- **Photos en base64** dans IndexedDB → taille importante, surveiller les 500Mo Supabase
- **iOS PWA** : `getCurrentPosition` se coupe si l'écran se verrouille (limitation Apple, pas contournable)
- **EXIF GPS** : iOS Safari peut stripper les métadonnées EXIF à la sélection depuis la galerie → fallback GPS
- **Supabase free tier** : pause après 7 jours sans activité → restaurer depuis le dashboard
