// Configuration Drizzle Kit : dialecte PostgreSQL, chemin du schéma et dossier des migrations.

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://esi:esi@localhost:5432/esi_library",
  },
  verbose: true,
  strict: true,
});
