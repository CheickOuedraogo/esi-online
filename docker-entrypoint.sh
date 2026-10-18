#!/bin/sh
# Entrée du conteneur applicatif de production :
# 1. applique les migrations Drizzle (idempotentes, suivies dans drizzle.__drizzle_migrations)
# 2. démarre Next.js
# DATABASE_URL est fournie par docker-compose (env_file .env + interpolation).

set -e

echo "==> Application des migrations de base de données..."
npx drizzle-kit migrate

echo "==> Démarrage de l'application Next.js..."
exec npm start
