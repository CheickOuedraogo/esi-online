# ESI-Library (esi-online)

Plateforme documentaire numérique de l'**École Supérieure d'Informatique (ESI)** située à Bobo-Dioulasso, au sein de l'**Université Nazi Boni (UNB)** (Burkina Faso).

Elle permet de centraliser, consulter, modérer et télécharger les ressources pédagogiques (cours, TD, TP, examens, corrigés, mémoires).

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- PostgreSQL 16 (ou via Docker)

### Installation et initialisation

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Initialiser en une commande (assistant interactif) :**
   ```bash
   npm run init
   ```
   L'assistant ne demande que **deux choses** :
   - l'utilisateur PostgreSQL (défaut : `postgres`),
   - son mot de passe (vide si aucun).

   Puis, automatiquement :
   - crée le rôle `esi`/`esi` et la base `esi_library` si besoin
     (si rien n'écoute sur le port 5432, tente Docker Compose),
   - génère le fichier `.env` (`SESSION_SECRET` inclus),
   - applique les migrations Drizzle,
   - peuple la base avec un jeu de données de démonstration,
   - vérifie que tout fonctionne (schéma, comptes, mots de passe, stockage).

   Tout le reste est pris par défaut. Pour accepter encore plus vite :
   ```bash
   npm run init -- --yes
   ```

   > `npm init` (sans `run`) est une commande réservée à npm lui-même —
   > c'est bien `npm run init` qu'il faut lancer.

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   # Accessible sur http://localhost:3000
   ```

### Installation manuelle (sans l'assistant)

1. `cp .env.example .env` et adapter les variables.
2. `docker compose up postgres -d` (si PostgreSQL via Docker).
3. `npm run db:migrate && npm run db:seed`.

---

## 👥 Comptes de démonstration

Après exécution de `npm run init` (ou `npm run db:seed`) :

| Profil | E-mail | Mot de passe | Rôle / Statut |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@gmail.com` (ou selon `.env`) | `admin1234` | Administrateur |
| **Étudiant validé** | `etudiant@gmail.com` | `etudiant1234` | Étudiant validé (L1) |
| **Étudiant validé** | `karim.diallo@gmail.com` | `karim1234` | Étudiant validé (L3) |
| **Étudiant validé** | `fatou.traore@gmail.com` | `fatou1234` | Étudiant validé (M1) |
| **En attente** | `awa.traore@gmail.com` | `awa1234` | En attente de validation administrateur |
| **Suspendu** | `ibrahim.kouda@gmail.com` | `ibrahim1234` | Compte suspendu |

---

## 🛠️ Commandes utiles

```bash
# Vérification des types TypeScript
npm run typecheck

# Linter ESLint
npm run lint

# Tests unitaires et d'intégration
npm test

# Audit de cohérence des fichiers et métadonnées
npm run storage:check

# Build de production
npm run build

# Démarrer en production
npm start
```

---

## 🐳 Déploiement Docker

Pour lancer l'ensemble des services (PostgreSQL, Application Next.js, Caddy et
sauvegardes quotidiennes) :

```bash
# .env doit définir POSTGRES_PASSWORD (voir .env.example)
docker compose up -d --build
```

> 🚀 **Déploiement sur VPS** (domaine, HTTPS auto, sauvegardes, mises à jour) :
> voir le guide complet [DEPLOY.md](./DEPLOY.md).
