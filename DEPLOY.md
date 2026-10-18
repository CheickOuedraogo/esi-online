# Déploiement sur VPS — ESI-Library

Guide complet pour héberger l'application sur un VPS unique, avec les documents
téléversés stockés sur le disque du VPS et des sauvegardes automatiques.

**Architecture :**

```
Internet ──► Caddy (:80/:443, HTTPS auto) ──► App Next.js (:3000, interne)
                                          └──► PostgreSQL 16 (interne + localhost:5432)
                                          └──► cron sauvegardes (02:00, base + uploads)
```

- **Documents** : montés dans `./uploads` sur le disque du VPS (visibles, sauvegardés quotidiennement).
- **Base** : volume Docker `postgres_data`.
- **Sauvegardes** : volume Docker `backups_data` (rotation 7 jours / 4 semaines).
- **HTTPS** : certificats Let's Encrypt gérés automatiquement par Caddy via `APP_DOMAIN`.

---

## 1. Prérequis VPS

- Ubuntu 22.04+ / Debian 12+ (ou équivalent), 2 vCPU / 2 Go RAM conseillés
- Un nom de domaine pointant en **A** vers l'IP du VPS (ex. `esi-library.bf` → `203.0.113.10`)
  - La propagation DNS doit être faite avant le premier lancement (Caddy demande le certificat HTTPS au premier démarrage)
- Docker + le plugin Compose :
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

## 2. Pare-feu

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirigé vers HTTPS)
ufw allow 443/tcp   # HTTPS
ufw allow 443/udp   # HTTP/3 (optionnel)
ufw enable
```

Postgres (5432) n'est exposé que sur `127.0.0.1` : rien à ouvrir.

## 3. Clonage et configuration

```bash
git clone <url-du-depot> /opt/esi-online
cd /opt/esi-online

cp .env.example .env
nano .env
```

Variables à renseigner dans `.env` :

| Variable | Valeur |
| :--- | :--- |
| `POSTGRES_PASSWORD` | Mot de passe fort pour PostgreSQL (ex. `openssl rand -base64 24`) |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `APP_DOMAIN` | Le domaine public, ex. `esi-library.bf` |
| `APP_URL` | `https://<domaine>` (ex. `https://esi-library.bf`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte admin créé par le seed |

> ⚠️ Ne jamais committer `.env` (déjà ignoré par git et Docker).

## 4. Premier déploiement

```bash
./scripts/deploy.sh
```

Le script effectue : `git pull` → `chown` du dossier `uploads` (uid 1001 du
conteneur) → build de l'image → `docker compose up` → **migrations automatiques**
au démarrage du conteneur app → seed idempotent (admin + niveaux/types) →
vérification de la santé.

Equivalent manuel :

```bash
mkdir -p uploads && chown -R 1001:1001 uploads
docker compose up -d --build
docker compose exec app npx tsx src/server/db/seed.ts
```

## 5. Vérification

```bash
docker compose ps                                  # tous les services "healthy"
curl -s https://<domaine>/api/health               # {"status":"ok"}
docker compose logs caddy | grep -i certificate    # certificat HTTPS obtenu
```

Puis se connecter sur `https://<domaine>/login` avec le compte admin du seed.

## 6. Sauvegardes

Le service `backup` tourne en continu et exécute `scripts/backup.sh` chaque
nuit à **02:00 UTC** :

- `pg_dump` de la base → `/backups/daily/esi_db_<date>.sql.gz`
- Archive tar de `./uploads` → `/backups/daily/esi_uploads_<date>.tar.gz`
- Chaque dimanche : copie dans `/backups/weekly/`
- Rotation : 7 jours quotidiens, 4 semaines hebdomadaires

Journal des sauvegardes :

```bash
docker compose logs backup
docker compose exec backup ls -la /backups/daily
```

### Restaurer une sauvegarde

Base de données :

```bash
gunzip -c /backups/daily/esi_db_YYYYMMDD_HHMMSS.sql.gz \
  | docker compose exec -T postgres psql -U esi -d esi_library
```

Fichiers téléversés (à faire à l'arrêt de l'app) — on copie l'archive hors du
volume de sauvegarde, puis on l'extrait sur l'hôte :

```bash
docker compose stop app
docker compose cp backup:/backups/daily/esi_uploads_YYYYMMDD_HHMMSS.tar.gz ./
tar -xzf esi_uploads_YYYYMMDD_HHMMSS.tar.gz -C /opt/esi-online
rm esi_uploads_YYYYMMDD_HHMMSS.tar.gz
chown -R 1001:1001 uploads
docker compose start app
```

### Sauvegardes hors ligne (recommandé)

Le volume `backups_data` vit sur le VPS : copiez-le régulièrement ailleurs
(rsync vers un second serveur, sauvegarde chez l'hébergeur, etc.) :

```bash
docker compose exec backup tar -czf - /backups | gzip > /tmp/esi-backups-$(date +%F).tar.gz
scp /tmp/esi-backups-*.tar.gz backup@autre-serveur:/srv/backups/
```

## 7. Mises à jour

```bash
./scripts/deploy.sh
```

Les migrations sont appliquées automatiquement au redémarrage du conteneur app.
Les nouvelles variables d'`env` éventuelles sont documentées dans `.env.example`.

## 8. Maintenance

```bash
docker compose logs -f app          # logs applicatifs
docker compose logs -f caddy        # accès HTTP / HTTPS
docker compose exec app npx tsx scripts/check-storage-consistency.ts
docker compose exec -T app npm test # tests (nécessite .env monté)
docker compose restart app          # redémarrage
```

Redémarrage VPS : tous les services sont en `restart: unless-stopped` —
tout remonte automatiquement (Postgres, app, Caddy, sauvegardes).

## 9. Dépannage courant

| Symptôme | Cause / solution |
| :--- | :--- |
| `docker compose up` échoue avec « POSTGRES_PASSWORD manquant » | `.env` absent ou incomplet (§3) |
| Caddy échoue à obtenir le certificat | DNS non propagé ou port 80 bloqué — corriger puis `docker compose restart caddy` |
| Erreur 503 sur `/api/health` | PostgreSQL pas sain : `docker compose logs postgres` |
| Uploads refusés (permission denied) | `chown -R 1001:1001 uploads` |
| Page blanche après déploiement | `docker compose logs app` — en général une variable d'env manquante dans `.env` |
