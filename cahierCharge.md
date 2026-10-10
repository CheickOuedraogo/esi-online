Cahier des charges Backend – ESI-Library
Oct 10, 2026 · @Cheick
L'équipe back livre l'API et la couche serveur d'ESI-Library : authentification, documents, propositions, administration et stockage de fichiers, dans src/app/api/ et src/server/. Ce document complète le cahier des charges général et reprend l'ossature déjà générée.
1. Périmètre et propriété du code
Zone
Propriétaire
Contenu
src/app/api/
Back
Route handlers très fins
src/server/
Back
config, db, services, auth, storage, errors, utils
src/middleware.ts
Back
Protection des routes selon session, statut et rôle
src/contracts/
Partagé Back + Front
Schémas Zod et types, modifiés par PR validée par les deux équipes
Dockerfile, docker-compose.yml, Caddyfile, scripts/backup.sh, ci.yml
Back
Déploiement, sauvegardes, intégration continue
src/app/ (hors api), components/, features/, lib/
Front
Interdits d'import depuis server/ (règle ESLint)
Règles de code
• Un route handler valide l'entrée avec contracts/, appelle un service de server/services/ et renvoie la réponse. Aucune logique métier dedans.
• Toutes les requêtes à la base passent par Drizzle. Aucun SQL brut construit par concaténation.
• Aucun envoi d'email dans cette version.
• Tout le code est en TypeScript strict.
2. Stack
Élément
Choix
API
Next.js (App Router), route handlers, préfixe /api
Base de données
PostgreSQL
ORM et migrations
Drizzle + drizzle-kit
Validation
Zod, schémas dans contracts/
Mots de passe
argon2 (argon2id)
Sessions
En base, cookie httpOnly
Fichiers
Disque du VPS derrière une interface de stockage, S3 plus tard
Déploiement
Docker Compose (app, postgres, caddy) sur un VPS
3. Modèle de données
Énumérations
• role : student, admin
• user_status : pending, validated, rejected, suspended
• visibility : public, students
• document_status : pending, approved, rejected
Tables (toutes avec id uuid en clé primaire)
Table
Colonnes principales
Contraintes
users
full_name, email, password_hash, role, status, must_change_password (défaut false), program_id, level_id, created_at, updated_at
email unique, stocké en minuscules
levels
name
name unique
programs
name
name unique
subjects
name, level_id, program_id
unique (name, level_id, program_id)
document_types
name
unique ; valeurs initiales : cours, TD, TP, examen, corrigé, mémoire, autre
documents
title, description, subject_id, type_id, academic_year (nullable), visibility, status, file_key, original_filename, mime_type, size_bytes, uploaded_by, download_count (défaut 0), search_vector, created_at, published_at
download_count >= 0 ; published_at renseigné uniquement à l'approbation
sessions
token_hash, user_id, expires_at, created_at, ip, user_agent
token_hash unique
password_reset_requests
user_id, status (pending, done), created_at, handled_by, handled_at

rejections
target_type (user, document), target_id, reason, created_by, created_at

Index
• documents.search_vector : GIN (full-text, configuration française sur titre et description).
• documents.title : GIN avec pg_trgm (recherche partielle).
• documents : (status, visibility), subject_id, type_id, academic_year, published_at, download_count.
• users : email ; sessions : expires_at ; password_reset_requests : status.
Remarques
• La base ne stocke jamais de chemin absolu, seulement la clé relative du fichier (file_key).
• Un document déposé directement par un admin naît au statut approved. Une proposition d'étudiant naît au statut pending.
• Le premier admin est créé par db/seed.ts à partir de variables d'environnement (ADMIN_EMAIL, ADMIN_PASSWORD), à ajouter à .env.example.
4. Authentification et sessions
Inscription
• Champs : nom, email, mot de passe (8 caractères minimum), filière, niveau.
• Rôle student, statut pending. Email déjà utilisé : erreur CONFLICT.
Connexion
• Statuts pending et rejected : la connexion réussit, la réponse indique le statut et le front affiche l'écran d'attente. Ces comptes n'accèdent à aucune route documentaire privée.
• Statut suspended : connexion refusée (ACCOUNT_SUSPENDED).
• Message d'erreur identique pour email inconnu et mot de passe faux.
Session
• Jeton aléatoire de 32 octets, seul son hash SHA-256 est stocké.
• Cookie httpOnly, secure, sameSite=Lax. Durée proposée : 7 jours glissants.
• Suspension, suppression d'un compte ou changement de mot de passe : invalidation des sessions concernées.
Mot de passe oublié (sans email)
1. POST /api/auth/request-reset avec l'email. Réponse toujours 202, qu'il existe ou non. Si le compte existe, une ligne pending est créée.
2. L'admin voit la liste des demandes et déclenche la réinitialisation. Le serveur génère un mot de passe temporaire aléatoire (12 caractères minimum), met must_change_password à vrai, invalide les sessions, marque la demande done et renvoie le mot de passe une seule fois dans la réponse.
3. À la connexion suivante, tant que must_change_password est vrai, seules les routes me, change-password et logout répondent. Les autres renvoient MUST_CHANGE_PASSWORD.
Gardes (server/auth/guards.ts)
Garde
Condition
requireAuth
Session valide
requireRole('admin')
Session valide et rôle admin
requireValidatedStudent
Session valide et statut validated (un admin passe aussi)
Limitation de débit : 5 tentatives de connexion par quart d'heure et par couple IP + email, 3 demandes de réinitialisation par heure et par IP. Réponse RATE_LIMITED (429).
5. API
Toutes les routes sont en JSON, sauf les envois de fichiers (multipart/form-data) et les téléchargements. Les listes acceptent page (défaut 1) et pageSize (défaut 20, maximum 100).
Authentification
Méthode
Route
Accès
Rôle
POST
/api/auth/register
Public
Crée un compte au statut pending
POST
/api/auth/login
Public
Ouvre une session, renvoie id, rôle, statut, mustChangePassword
POST
/api/auth/logout
Connecté
Ferme la session
GET
/api/auth/me
Connecté
Utilisateur courant
POST
/api/auth/request-reset
Public
Enregistre une demande de réinitialisation
POST
/api/auth/change-password
Connecté
Change le mot de passe, remet must_change_password à faux
Public et catalogue
Méthode
Route
Accès
Rôle
GET
/api/catalog
Public
Niveaux, filières, matières, types (formulaire d'inscription, filtres)
GET
/api/public/documents
Public
Documents approved et public, avec filtres
GET
/api/public/documents/:id
Public
Détail
GET
/api/public/documents/:id/download
Public
Téléchargement (à confirmer, voir section 14)
Étudiant validé
Méthode
Route
Accès
Rôle
GET
/api/documents
Étudiant validé
Tous les documents approved (public et students)
GET
/api/documents/:id
Étudiant validé
Détail
GET
/api/documents/:id/download
Étudiant validé
Téléchargement et incrément du compteur
POST
/api/proposals
Étudiant validé
Propose un document (fichier + métadonnées)
GET
/api/me/proposals
Étudiant validé
Mes propositions, statut et motif de refus
DELETE
/api/proposals/:id
Propriétaire
Annule une proposition encore pending
Filtres des listes : q, levelId, programId, subjectId, typeId, year, sort (recent, popular, title). Les filtres se combinent en ET.
Administration (rôle admin)
Méthode
Route
Rôle
GET
/api/admin/users
Liste avec recherche q et filtre status
PATCH
/api/admin/users/:id/status
Valide, refuse (avec motif), suspend, réactive
DELETE
/api/admin/users/:id
Supprime un compte
POST
/api/admin/users/:id/reset-password
Génère le mot de passe temporaire
GET
/api/admin/reset-requests
Demandes de réinitialisation en attente
GET
/api/admin/documents
Tous les documents, tous statuts et visibilités
POST
/api/admin/documents
Dépôt direct (fichier + métadonnées + visibilité)
PATCH
/api/admin/documents/:id
Modifie métadonnées, visibilité, remplace le fichier si fourni
DELETE
/api/admin/documents/:id
Suppression définitive (ligne et fichier)
GET
/api/admin/proposals
Propositions, pending par défaut
PATCH
/api/admin/proposals/:id
Approuve (avec visibilité, métadonnées corrigeables) ou refuse (avec motif)
GET, POST, PATCH, DELETE
/api/admin/levels, programs, subjects, document-types (/:id pour PATCH et DELETE)
Gestion du catalogue
GET
/api/admin/stats
Tableau de bord : comptes en attente, propositions en attente, top téléchargements, totaux. Route absente de l'ossature, à ajouter.
Santé
GET /api/health : public, vérifie l'accès à la base, renvoie 200 ou 503.
6. Règles métier
Documents
• Recherche q : full-text français sur titre et description, complété par une recherche partielle pg_trgm sur le titre.
• Tri : recent = published_at décroissant ; popular = download_count décroissant puis published_at ; title = ordre alphabétique.
• Un document non approved n'est jamais visible hors admin. Le propriétaire d'une proposition la voit uniquement via /api/me/proposals.
• Téléchargement : droits vérifiés, fichier envoyé en streaming avec Content-Disposition: attachment, puis download_count = download_count + 1 en une seule requête atomique, uniquement si l'envoi réussit.
• Suppression par un admin : définitive, sans corbeille. La ligne est supprimée dans une transaction, puis le fichier. Si la suppression du fichier échoue, l'erreur est journalisée pour nettoyage ultérieur.
Envoi de fichiers
• Formats : PDF, DOCX, PPTX, JPG, PNG, ZIP.
• Taille maximale : MAX_UPLOAD_MB (50 par défaut). Fichier vide refusé.
• Le type réel est vérifié sur le contenu du fichier, pas sur l'extension ni sur le type MIME annoncé.
• Le nom stocké est généré par le serveur : yyyy/mm/<uuid>.<ext>. Le nom d'origine n'est gardé qu'en métadonnée, nettoyé.
Propositions
• Création : statut pending, visibilité students par défaut.
• Approbation : statut approved, published_at à l'instant, visibilité choisie par l'admin.
• Refus : statut rejected, ligne dans rejections avec le motif, visible de l'étudiant.
• Un étudiant ne peut annuler que ses propres propositions encore pending (suppression de la ligne et du fichier).
Comptes
• Refus d'un compte : ligne dans rejections avec le motif.
• Un admin ne peut pas se suspendre ni se supprimer lui-même, ni supprimer le dernier admin.
• Suppression d'un étudiant : ses documents approved sont conservés (uploaded_by mis à null), ses propositions pending et rejected sont supprimées avec leurs fichiers.
Catalogue
• Suppression d'un niveau, d'une filière, d'une matière ou d'un type refusée avec CONFLICT s'il est encore utilisé.
• Une matière doit référencer un niveau et une filière existants.
7. Format des réponses et des erreurs
• Objet unique : renvoyé directement.
• Liste : { items, page, pageSize, total }.
• Erreur : { error: { code, message, details? } }, défini dans contracts/errors.ts et partagé avec le front.
Code
HTTP
Cas
VALIDATION_ERROR
400
Entrée invalide (détails par champ)
UNAUTHENTICATED
401
Pas de session valide
FORBIDDEN
403
Rôle ou droit insuffisant
ACCOUNT_PENDING
403
Compte en attente
ACCOUNT_REJECTED
403
Compte refusé
ACCOUNT_SUSPENDED
403
Compte suspendu
MUST_CHANGE_PASSWORD
403
Mot de passe temporaire à changer
NOT_FOUND
404
Ressource absente ou non visible
CONFLICT
409
Email déjà pris, élément du catalogue utilisé
PAYLOAD_TOO_LARGE
413
Fichier trop gros
UNSUPPORTED_MEDIA_TYPE
415
Format non autorisé
RATE_LIMITED
429
Trop de tentatives
INTERNAL_ERROR
500
Erreur serveur, détail non exposé
L'enveloppe server/utils/api-handler.ts valide l'entrée, attrape les erreurs, les convertit dans ce format et journalise les erreurs 5xx.
8. Stockage des fichiers
• Interface StorageProvider dans storage.interface.ts : put(stream, key, mime), get(key) qui renvoie un flux, delete(key), exists(key).
• Implémentation locale (local.storage.ts) dans UPLOAD_DIR, avec protection contre la traversée de dossiers (le chemin résolu doit rester sous UPLOAD_DIR).
• s3.storage.ts : même interface, prévue pour plus tard (R2, B2 ou MinIO), sans changer les services.
• Envois et téléchargements toujours en flux : un fichier de 50 Mo n'est jamais chargé entièrement en mémoire.
• Les fichiers ne sont jamais servis par un dossier public : tout passe par les routes de téléchargement.
• Un script de contrôle liste les fichiers sans ligne en base et les lignes sans fichier.
9. Sécurité
• Mots de passe : argon2id, jamais journalisés ni renvoyés.
• Cookies de session httpOnly, secure, sameSite=Lax.
• Validation de toutes les entrées avec Zod, y compris paramètres d'URL et paramètres de requête.
• Contrôle d'accès vérifié dans chaque service, pas seulement dans le middleware.
• Un document non visible renvoie 404 plutôt que 403.
• Front et API sur la même origine : pas de CORS ouvert. En-têtes de sécurité HTTP activés.
• Variables sensibles dans .env hors dépôt ; env.ts refuse de démarrer si elles manquent ou sont invalides.
• Journaux structurés sans donnée sensible.
• Dépendances vérifiées en CI (npm audit).
10. Performance
• Liste de documents en moins d'une seconde pour plusieurs milliers de lignes, grâce aux index de la section 3.
• Pas de requêtes N+1 : les listes utilisent des jointures et ne sélectionnent que les colonnes nécessaires.
• Pagination obligatoire sur toutes les listes.
• Aperçu et téléchargement en streaming.
11. Déploiement et exploitation
• docker-compose.yml : services app, postgres (volume persistant, port non exposé) et caddy (HTTPS automatique).
• Migrations appliquées au déploiement avec drizzle-kit migrate.
• Sauvegarde quotidienne par scripts/backup.sh : pg_dump et copie du dossier des fichiers, envoyés hors du VPS. Rétention : 7 quotidiennes et 4 hebdomadaires. Une restauration complète est testée avant la mise en production.
• Supervision : /api/health surveillé par un service d'uptime, surveillance de l'espace disque.
• Variables d'environnement : DATABASE_URL, SESSION_SECRET, UPLOAD_DIR, MAX_UPLOAD_MB, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD.
12. Tests et intégration continue
• Tests unitaires des services : auth, documents, propositions, catalogue.
• Tests d'intégration des routes sur une vraie base PostgreSQL (Docker).
• Matrice d'accès testée pour chaque route avec quatre profils : visiteur, étudiant en attente, étudiant validé, admin.
• Tests d'envoi : mauvais format, fichier trop gros, extension falsifiée, fichier vide.
• CI (ci.yml) : lint, vérification des types, tests, npm audit. Une PR n'est fusionnée que si tout passe.
13. Collaboration avec l'équipe front
• Contrat d'abord : avant de coder une zone, les deux équipes valident ses schémas dans contracts/. Une PR qui modifie contracts/ demande l'accord des deux équipes (CODEOWNERS).
• Le front travaille avec des réponses simulées (MSW) conformes aux contrats pendant que l'API est en cours.
• Le back livre les zones dans l'ordre du plan ci-dessous et prévient le front à chaque lot terminé.
• Tout changement qui casse un contrat déjà livré est annoncé avant fusion.
• Seule l'équipe back modifie server/db/ et les migrations.
14. Plan de livraison
Lot
Contenu
Critère de livraison
0. Fondations
env.ts, client db, schéma et migration initiale, seed (catalogue et admin), api-handler, http-errors, /api/health, docker-compose
docker compose up démarre l'app et la base, la migration passe, /api/health répond 200
1. Authentification
Inscription, connexion, déconnexion, me, change-password, request-reset, sessions, gardes, limitation de débit, middleware
Matrice d'accès testée, mot de passe temporaire fonctionnel
2. Comptes et catalogue
Routes admin des utilisateurs, demandes de réinitialisation, CRUD du catalogue, /api/catalog
Un admin valide un compte et l'étudiant se connecte
3. Documents (fin de la V1)
Stockage, validation des fichiers, dépôt et gestion admin, listes publique et étudiante, recherche, filtres, tri, téléchargement, compteur, /api/admin/stats
Dépôt, recherche, filtre et téléchargement de bout en bout
4. Propositions (V1.1)
Proposition, suivi, annulation, modération admin
Une proposition est approuvée puis visible dans la bibliothèque
5. Durcissement
Revue sécurité, sauvegardes en production, test de restauration, tests de charge sur les envois, documentation
Une sauvegarde est restaurée avec succès sur un serveur neuf
15. Définition de « terminé » pour une route
• Le contrat (entrée, sortie, erreurs) est dans contracts/ et validé par le front.
• Le route handler est fin, la logique est dans un service testé.
• Tests couvrant : succès, entrée invalide, non connecté, rôle insuffisant.
• Les erreurs respectent le format standard.
• Aucun SQL brut, aucun secret en dur.
• Le commentaire de tête du fichier est à jour (méthode, contrat, service, rôle).
16. Points ouverts
• Un document public se télécharge-t-il sans compte
• Durée de session : 7 jours glissants proposés.
• Que faire des fichiers des propositions refusées : garde-t-on, ou purge après un délai ?
• Suppression d'un étudiant : conserver ses documents approuvés est une proposition à confirmer.
• Taille maximale des fichiers : 50 Mo proposés.
• GET /api/admin/stats est à ajouter à l'ossature, avec son contrat.
• ADMIN_EMAIL et ADMIN_PASSWORD sont à ajouter à .env.example.