// Lecture et validation des variables d'environnement avec Zod.
// Refuse de démarrer si une variable obligatoire est manquante ou invalide.

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL doit être une URL PostgreSQL valide"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET doit contenir au moins 32 caractères"),
  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR est requis"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
  APP_URL: z.string().url("APP_URL doit être une URL valide"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL doit être un email valide"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD doit contenir au moins 8 caractères"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      "❌ Variables d'environnement invalides :",
      result.error.flatten().fieldErrors
    );
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
