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

2. **Configurer l'environnement :**
   ```bash
   cp .env.example .env
   # Adapter les variables dans .env si nécessaire
   ```

3. **Lancer PostgreSQL avec Docker (optionnel) :**
   ```bash
   docker compose up postgres -d
   ```

4. **Appliquer les migrations et peupler la base :**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   # Accessible sur http://localhost:3000
   ```

---

## 👥 Comptes de démonstration

Après exécution de `npm run db:seed` :

| Profil | E-mail | Mot de passe | Rôle / Statut |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@esi.bf` (ou selon `.env`) | `Admin123!@#` | Administrateur |
| **Étudiant validé** | `etudiant@esi.bf` | `Etudiant123!` | Étudiant validé (accès bibliothèque & propositions) |
| **Étudiant en attente** | `awa.traore@esi.bf` | `Etudiant123!` | En attente de validation administrateur |

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
