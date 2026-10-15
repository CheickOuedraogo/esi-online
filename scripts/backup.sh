#!/usr/bin/env bash
# scripts/backup.sh : sauvegarde quotidienne de la base via pg_dump et copie du
# dossier uploads, avec rotation : 7 sauvegardes journalières et 4 hebdomadaires.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u") # 1 = Lundi, 7 = Dimanche

DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

echo "==> [${TIMESTAMP}] Début de la sauvegarde ESI-Library..."

# 1. Sauvegarde de la base de données PostgreSQL
DB_FILE="$DAILY_DIR/esi_db_${TIMESTAMP}.sql.gz"
echo "--> Export PostgreSQL vers $DB_FILE..."
pg_dump "${DATABASE_URL}" | gzip > "$DB_FILE"

# 2. Sauvegarde des fichiers téléversés
FILES_ARCHIVE="$DAILY_DIR/esi_uploads_${TIMESTAMP}.tar.gz"
if [ -d "$UPLOAD_DIR" ]; then
  echo "--> Archivage du dossier $UPLOAD_DIR vers $FILES_ARCHIVE..."
  tar -czf "$FILES_ARCHIVE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
fi

# 3. Sauvegarde hebdomadaire (chaque dimanche)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  echo "--> Copie vers les sauvegardes hebdomadaires..."
  cp "$DB_FILE" "$WEEKLY_DIR/"
  if [ -f "$FILES_ARCHIVE" ]; then
    cp "$FILES_ARCHIVE" "$WEEKLY_DIR/"
  fi
fi

# 4. Rotation et purge des anciennes sauvegardes
# Conserver 7 sauvegardes quotidiennes
echo "--> Rotation des sauvegardes quotidiennes (conservation : 7 jours)..."
find "$DAILY_DIR" -type f -mtime +7 -delete

# Conserver 4 sauvegardes hebdomadaires (28 jours)
echo "--> Rotation des sauvegardes hebdomadaires (conservation : 28 jours)..."
find "$WEEKLY_DIR" -type f -mtime +28 -delete

echo "==> [$(date +"%Y%m%d_%H%M%S")] Sauvegarde terminée avec succès !"
