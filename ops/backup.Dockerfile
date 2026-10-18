# Image des sauvegardes quotidiennes : pg_dump PostgreSQL 16 (identique au serveur),
# bash pour scripts/backup.sh et cron d'Alpine.
FROM postgres:16-alpine

RUN apk add --no-cache bash

COPY scripts/backup.sh /usr/local/bin/backup.sh
COPY ops/crontab /etc/crontabs/root
RUN chmod +x /usr/local/bin/backup.sh

# crond en premier plan : les sorties des jobs vont dans les logs du conteneur
# (docker compose logs backup).
CMD ["crond", "-f", "-l", "2"]
