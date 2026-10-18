#!/usr/bin/env bash
# scripts/deploy.sh : déploiement / mise à jour sur le VPS.
# À lancer depuis n'importe où dans le dépôt : ./scripts/deploy.sh
#
# Étapes : git pull → build image app → up (migrations auto au démarrage)
# → seed idempotent (admin + catalogue) → vérification santé.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ .env introuvable. Copiez .env.example puis renseignez les variables (voir DEPLOY.md)." >&2
  exit 1
fi

echo "==> Mise à jour du code (git pull)..."
git pull --ff-only

echo "==> Le dossier uploads doit être accessible à l'uid 1001 du conteneur..."
mkdir -p uploads
chown -R 1001:1001 uploads 2>/dev/null || sudo chown -R 1001:1001 uploads

echo "==> Construction de l'image applicative..."
docker compose build app

echo "==> Démarrage / redémarrage des services..."
docker compose up -d

echo "==> Attente de la santé de l'application (jusqu'à 60 s)..."
for i in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' esi_app 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    echo "Application saine."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "⚠️  L'application n'est pas devenue saine. Voir : docker compose logs app" >&2
    exit 1
  fi
  sleep 2
done

echo "==> Seed (idempotent) : compte admin + catalogue..."
docker compose exec -T app npx tsx src/server/db/seed.ts

echo "==> État des services :"
docker compose ps

echo "✅ Déploiement terminé."
