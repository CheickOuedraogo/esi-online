// Assistant d'initialisation pour les testeurs :
// 1. demande le superutilisateur PostgreSQL (nom + mot de passe) — tout le
//    reste est pris par défaut (rôle esi/esi, base esi_library, admin de démo),
// 2. écrit le fichier .env (SESSION_SECRET généré automatiquement),
// 3. provisionne la base PostgreSQL (instance locale : rôle + base ;
//    si rien n'écoute sur 5432, tente Docker Compose),
// 4. applique les migrations Drizzle,
// 5. peuple la base (jeu de démonstration complet),
// 6. vérifie que tout est en ordre (schéma, comptes, mots de passe, stockage).
//
// Lancement : npm run init            (assisté, interactif)
//             npm run init -- --yes   (toutes les valeurs par défaut)
//
// Flags utiles :
//   --yes, -y                  accepter tous les défauts sans interagir
//   --force                    régénérer le .env même s'il existe déjà
//   --pg-user=NOM --pg-password=MDP   superutilisateur PostgreSQL
//   --database-url=URL         utiliser cette URL directement (sans provisionner)
//   --db-role=NOM --db-password=MDP --db-name=NOM
//   --admin-email=EMAIL --admin-password=MDP

import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { Client } from "pg";
import * as argon2 from "argon2";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const DEFAULT_PG_USER = "postgres";
const DEFAULT_DB_USER = "esi";
const DEFAULT_DB_PASSWORD = "esi";
const DEFAULT_DB_NAME = "esi_library";

// ── Utilitaires ──────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// Identifiant SQL (nom de rôle/base) entre guillemets doubles, échappé.
function sqlIdentifier(value: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    fail(`Nom SQL invalide (lettres, chiffres, _ uniquement) : ${value}`);
  }
  return `"${value}"`;
}

function run(
  bin: string,
  args: string[],
  env: Record<string, string | undefined>,
  label: string
): void {
  const localBin = path.join(ROOT, "node_modules", ".bin", bin);
  const command = fs.existsSync(localBin) ? localBin : `npx`;
  const commandArgs = fs.existsSync(localBin) ? args : [bin, ...args];
  console.log(`\n▶ ${label} (${[command, ...commandArgs].join(" ")})`);
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: false,
  });
  if (result.status !== 0) {
    fail(`Échec de « ${label} » (code ${result.status ?? "signal"}).`);
  }
}

async function isPortOpen(port: number, host = "localhost"): Promise<boolean> {
  const net = await import("net");
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host, timeout: 1500 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// ── Provisionnement PostgreSQL ───────────────────────────────────────────────

// Construit une URL postgres:// en échappant correctement utilisateur/mot de passe.
function postgresUrl(
  user: string,
  password: string,
  dbName: string,
  host = "localhost",
  port = 5432
): string {
  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);
  return `postgres://${auth}@${host}:${port}/${dbName}`;
}

async function ensureRoleAndDatabase(
  pgUser: string,
  pgPassword: string,
  role: string,
  password: string,
  dbName: string
): Promise<void> {
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: pgUser,
    password: pgPassword || undefined,
    database: "postgres",
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Si la base cible est déjà joignable, on n'a pas besoin du superutilisateur.
    const target = new Client({
      connectionString: postgresUrl(role, password, dbName),
      connectionTimeoutMillis: 5000,
    });
    try {
      await target.connect();
      await target.end();
      console.log(
        `ℹ Base déjà joignable, provisioning superutilisateur ignoré (${message}).`
      );
      return;
    } catch {
      fail(
        `Impossible de joindre PostgreSQL (${message}).\n` +
          `  Vérifiez que le serveur tourne, que l'utilisateur « ${pgUser} »\n` +
          `  et son mot de passe sont corrects, et que l'authentification\n` +
          `  locale (host/md5/trust sur localhost) est autorisée.`
      );
    }
  }

  try {
    const roleExists = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [role]
    );
    if (roleExists.rowCount === 0) {
      await client.query(
        `CREATE ROLE ${sqlIdentifier(role)} LOGIN PASSWORD ${sqlLiteral(password)}`
      );
      console.log(`✓ Rôle PostgreSQL créé : ${role}`);
    } else {
      await client.query(
        `ALTER ROLE ${sqlIdentifier(role)} WITH LOGIN PASSWORD ${sqlLiteral(password)}`
      );
      console.log(`✓ Rôle PostgreSQL mis à jour : ${role}`);
    }

    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (dbExists.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${sqlIdentifier(dbName)} OWNER ${sqlIdentifier(role)}`
      );
      console.log(`✓ Base PostgreSQL créée : ${dbName}`);
    } else {
      console.log(`✓ Base PostgreSQL déjà existante : ${dbName}`);
    }
  } finally {
    await client.end();
  }
}

async function ensureDockerPostgres(password: string): Promise<void> {
  const info = spawnSync("docker", ["info"], { stdio: "ignore", shell: false });
  if (info.status !== 0) {
    fail(
      "Docker n'est pas accessible sur cette machine.\n" +
        "  Choisissez l'option « instance locale » ou installez/autorisez Docker."
    );
  }
  if (await isPortOpen(5432)) {
    fail(
      "Le port 5432 est déjà occupé — impossible de démarrer le conteneur PostgreSQL.\n" +
        "  Utilisez probablement l'option « instance locale » à la place."
    );
  }
  console.log("\n▶ Démarrage de PostgreSQL via Docker Compose...");
  const result = spawnSync(
    "docker",
    ["compose", "up", "-d", "postgres"],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        POSTGRES_PASSWORD: password,
        POSTGRES_DB: DEFAULT_DB_NAME,
        POSTGRES_USER: DEFAULT_DB_USER,
      },
      shell: false,
    }
  );
  if (result.status !== 0) {
    fail("docker compose up postgres a échoué.");
  }
  console.log("▶ Attente de la santé du conteneur PostgreSQL...");
  for (let i = 0; i < 30; i++) {
    const ready = spawnSync(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", DEFAULT_DB_USER, "-d", DEFAULT_DB_NAME],
      { cwd: ROOT, stdio: "ignore", shell: false }
    );
    if (ready.status === 0) {
      console.log("✓ PostgreSQL est prêt.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  fail("PostgreSQL n'est pas devenu prêt dans les temps (60s).");
}

// ── Vérification finale ──────────────────────────────────────────────────────

async function verify(envVars: Record<string, string>): Promise<void> {
  console.log("\nVérification de l'installation...");

  const expectedTables = [
    "users",
    "levels",
    "document_types",
    "documents",
    "sessions",
    "password_reset_requests",
    "rejections",
  ];
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  const problems: string[] = [];

  try {
    await client.connect();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`Connexion à DATABASE_URL impossible : ${message}`);
  }

  try {
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [expectedTables]
    );
    const found = new Set(tables.rows.map((r: { table_name: string }) => r.table_name));
    for (const table of expectedTables) {
      if (!found.has(table)) problems.push(`table manquante : ${table}`);
    }
    if (problems.length === 0) {
      console.log(`✓ ${expectedTables.length} tables présentes`);
    }

    try {
      const migrations = await client.query(
        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
      );
      const n = migrations.rows[0].n as number;
      if (n === 0) problems.push("aucune migration appliquée");
      else console.log(`✓ ${n} migration(s) appliquée(s)`);
    } catch {
      problems.push("table des migrations Drizzle introuvable");
    }

    const adminEmail = (envVars.ADMIN_EMAIL ?? "admin@gmail.com").toLowerCase();
    const adminPassword = envVars.ADMIN_PASSWORD ?? "admin1234";
    const adminRow = await client.query(
      "SELECT password_hash FROM users WHERE email = $1",
      [adminEmail]
    );
    if (adminRow.rowCount === 0) {
      problems.push(`compte admin manquant : ${adminEmail}`);
    } else {
      const ok = await argon2.verify(
        adminRow.rows[0].password_hash as string,
        adminPassword
      );
      if (!ok) problems.push(`mot de passe admin incorrect pour ${adminEmail}`);
      else console.log(`✓ compte admin opérationnel : ${adminEmail}`);
    }

    const etudiantRow = await client.query(
      "SELECT password_hash FROM users WHERE email = $1",
      ["etudiant@gmail.com"]
    );
    if (etudiantRow.rowCount === 0) {
      problems.push("compte étudiant de démo manquant : etudiant@gmail.com");
    } else {
      const ok = await argon2.verify(
        etudiantRow.rows[0].password_hash as string,
        "etudiant1234"
      );
      if (!ok) problems.push("mot de passe incorrect pour etudiant@gmail.com");
      else console.log("✓ compte étudiant opérationnel : etudiant@gmail.com");
    }

    const users = await client.query(
      "SELECT role, status, count(*)::int AS n FROM users GROUP BY role, status ORDER BY role, status"
    );
    const accounts = users.rows
      .map((r: { role: string; status: string; n: number }) => `${r.n} ${r.role}/${r.status}`)
      .join(", ");
    console.log(`✓ ${users.rows.reduce((s: number, r: { n: number }) => s + r.n, 0)} compte(s) : ${accounts}`);

    const docs = await client.query(
      "SELECT status, count(*)::int AS n FROM documents GROUP BY status ORDER BY status"
    );
    const docSummary =
      docs.rows
        .map((r: { status: string; n: number }) => `${r.n} ${r.status}`)
        .join(", ") || "aucun";
    console.log(`✓ documents : ${docSummary}`);
  } finally {
    await client.end();
  }

  const uploadDir = path.resolve(envVars.UPLOAD_DIR ?? "./uploads");
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    const probe = path.join(uploadDir, ".setup-probe");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    console.log(`✓ dossier de stockage accessible : ${uploadDir}`);
  } catch {
    problems.push(`dossier de stockage inaccessible : ${uploadDir}`);
  }

  if (problems.length > 0) {
    console.error("\n❌ Problèmes détectés :");
    for (const problem of problems) console.error(`   - ${problem}`);
    process.exit(1);
  }
  console.log("\n✅ Tout est en ordre !");
}

// ── Principal ────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Map<string, string>();
  for (const arg of argv) {
    const match = arg.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (match) flags.set(match[1], match[2] ?? "true");
  }
  const yes =
    (flags.get("yes") ?? flags.get("y") ?? "false") === "true";
  const force = (flags.get("force") ?? "false") === "true";
  const interactive = process.stdin.isTTY === true && !yes;
  const rl = interactive
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;

  const ask = async (question: string, defaultValue: string): Promise<string> => {
    if (!rl) return defaultValue;
    const answer = (await rl.question(`${question} [${defaultValue}] : `)).trim();
    return answer || defaultValue;
  };

  console.log("🎓 Initialisation de ESI-Library (environnement de test)\n");

  let envVars: Record<string, string> = {};

  if (fs.existsSync(ENV_PATH) && !force) {
    const existing = parseEnvFile(fs.readFileSync(ENV_PATH, "utf-8"));
    const regenerate = interactive
      ? (await ask("Le fichier .env existe déjà. Le régénérer ? (o/N)", "N"))
          .toLowerCase()
          .startsWith("o")
      : false;
    if (!regenerate) {
      envVars = existing;
      console.log("✓ Fichier .env existant conservé.");
    }
  }

  if (Object.keys(envVars).length === 0) {
    const databaseUrlFlag = flags.get("database-url");

    if (databaseUrlFlag) {
      envVars.DATABASE_URL = databaseUrlFlag;
      envVars.POSTGRES_PASSWORD = flags.get("db-password") ?? DEFAULT_DB_PASSWORD;
    } else {
      // Seules questions : identifiants du superutilisateur PostgreSQL.
      // Le reste (rôle esi, base esi_library) est pris par défaut.
      const pgUser = await ask(
        "Utilisateur PostgreSQL (superutilisateur)",
        flags.get("pg-user") ?? DEFAULT_PG_USER
      );
      const pgPassword = await ask(
        "Mot de passe PostgreSQL (vide si aucun)",
        flags.get("pg-password") ?? ""
      );
      const role = flags.get("db-role") ?? DEFAULT_DB_USER;
      const dbPassword = flags.get("db-password") ?? DEFAULT_DB_PASSWORD;
      const dbName = flags.get("db-name") ?? DEFAULT_DB_NAME;

      if (await isPortOpen(5432)) {
        // Un serveur écoute déjà sur 5432 : on crée le rôle et la base directement.
        await ensureRoleAndDatabase(pgUser, pgPassword, role, dbPassword, dbName);
        envVars.DATABASE_URL = postgresUrl(role, dbPassword, dbName);
      } else {
        // Rien sur 5432 : on tente de démarrer PostgreSQL via Docker Compose.
        console.log("\nℹ Rien sur le port 5432 — tentative via Docker Compose...");
        await ensureDockerPostgres(dbPassword);
        envVars.DATABASE_URL = postgresUrl(role, dbPassword, dbName);
      }
      envVars.POSTGRES_PASSWORD = dbPassword;
    }

    envVars.SESSION_SECRET = crypto.randomBytes(48).toString("base64url");
    envVars.UPLOAD_DIR = flags.get("upload-dir") ?? "./uploads";
    envVars.MAX_UPLOAD_MB = flags.get("max-upload-mb") ?? "50";
    envVars.APP_URL = flags.get("app-url") ?? "http://localhost:3000";
    envVars.ADMIN_EMAIL = flags.get("admin-email") ?? "admin@gmail.com";
    envVars.ADMIN_PASSWORD = flags.get("admin-password") ?? "admin1234";

    const envContent = `# Généré par scripts/setup.ts (${new Date().toISOString()})
# ── Base de données ─────────────────────────────────────────────────────────
DATABASE_URL="${envVars.DATABASE_URL}"
POSTGRES_PASSWORD=${envVars.POSTGRES_PASSWORD}

# ── Application ─────────────────────────────────────────────────────────────
SESSION_SECRET="${envVars.SESSION_SECRET}"
UPLOAD_DIR=${envVars.UPLOAD_DIR}
MAX_UPLOAD_MB=${envVars.MAX_UPLOAD_MB}
APP_URL=${envVars.APP_URL}

# ── Compte admin initial (utilisé par le seed) ──────────────────────────────
ADMIN_EMAIL=${envVars.ADMIN_EMAIL}
ADMIN_PASSWORD=${envVars.ADMIN_PASSWORD}
`;
    fs.writeFileSync(ENV_PATH, envContent, { mode: 0o600 });
    console.log(`\n✓ Fichier .env écrit : ${ENV_PATH}`);
  }

  if (rl) rl.close();

  // Rend les variables disponibles pour les sous-processus et la vérification.
  for (const [key, value] of Object.entries(envVars)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  if (envVars.UPLOAD_DIR) {
    fs.mkdirSync(path.resolve(envVars.UPLOAD_DIR), { recursive: true });
    console.log(`✓ Dossier de stockage prêt : ${path.resolve(envVars.UPLOAD_DIR)}`);
  }

  run(
    "drizzle-kit",
    ["migrate"],
    { DATABASE_URL: envVars.DATABASE_URL },
    "Migrations de la base de données"
  );

  run(
    "tsx",
    ["src/server/db/seed.ts"],
    {
      DATABASE_URL: envVars.DATABASE_URL,
      SESSION_SECRET: envVars.SESSION_SECRET,
      UPLOAD_DIR: envVars.UPLOAD_DIR,
      MAX_UPLOAD_MB: envVars.MAX_UPLOAD_MB,
      APP_URL: envVars.APP_URL,
      ADMIN_EMAIL: envVars.ADMIN_EMAIL,
      ADMIN_PASSWORD: envVars.ADMIN_PASSWORD,
    },
    "Peuplement de la base (données de démonstration)"
  );

  await verify(envVars);

  console.log(`
Installation terminée !

▶ Lancer l'application :
  npm run dev   → ${envVars.APP_URL}

▶ Connexion (http://localhost:3000/login) :
  Admin     ${envVars.ADMIN_EMAIL} / ${envVars.ADMIN_PASSWORD}
  Étudiant  etudiant@gmail.com / etudiant1234
`);
}

main().catch((err) => {
  console.error("\n❌ Erreur inattendue :", err);
  process.exit(1);
});
