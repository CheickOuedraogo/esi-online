// Script de peuplement de la base de données :
// Niveaux, filières, matières types, types de documents, et compte administrateur initial.

import { eq } from "drizzle-orm";
import { db, pool } from "./client";
import {
  levels,
  programs,
  subjects,
  documentTypes,
  users,
} from "./schema";
import { env } from "@/server/config/env";
import { hashPassword } from "@/server/auth/password";

async function seed() {
  console.log("🌱 Début du peuplement de la base de données...");

  // 1. Niveaux (Cycle Licence et Master ESI - UNB)
  const defaultLevels = ["L1", "L2", "L3", "M1", "M2"];
  const levelMap = new Map<string, string>();

  for (const name of defaultLevels) {
    const existing = await db
      .select({ id: levels.id })
      .from(levels)
      .where(eq(levels.name, name))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(levels)
        .values({ name })
        .returning();
      levelMap.set(name, inserted.id);
      console.log(`  ✓ Niveau ajouté : ${name}`);
    } else {
      levelMap.set(name, existing[0].id);
    }
  }

  // 2. Filières (ESI - Université Nazi Boni)
  const defaultPrograms = [
    "Tronc Commun",
    "Génie Logiciel (GL)",
    "Systèmes et Réseaux (SR)",
    "Systèmes d'Information (SI)",
  ];
  const programMap = new Map<string, string>();

  for (const name of defaultPrograms) {
    const existing = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.name, name))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(programs)
        .values({ name })
        .returning();
      programMap.set(name, inserted.id);
      console.log(`  ✓ Filière ajoutée : ${name}`);
    } else {
      programMap.set(name, existing[0].id);
    }
  }

  // 3. Types de documents (cours, TD, TP, examen, corrigé, mémoire, autre)
  const defaultDocTypes = [
    "cours",
    "TD",
    "TP",
    "examen",
    "corrigé",
    "mémoire",
    "autre",
  ];

  for (const name of defaultDocTypes) {
    const existing = await db
      .select({ id: documentTypes.id })
      .from(documentTypes)
      .where(eq(documentTypes.name, name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(documentTypes).values({ name });
      console.log(`  ✓ Type de document ajouté : ${name}`);
    }
  }

  // 4. Matières de démonstration
  const l1LevelId = levelMap.get("L1");
  const tcProgId = programMap.get("Tronc Commun");

  if (l1LevelId && tcProgId) {
    const defaultSubjects = [
      "Algorithmique et Structures de Données 1",
      "Architecture des Ordinateurs",
      "Analyse Mathématique",
      "Algèbre Linéaire",
      "Systèmes d'Exploitation 1",
      "Technologies Web et Internet",
    ];

    for (const name of defaultSubjects) {
      const existing = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.name, name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(subjects).values({
          name,
          levelId: l1LevelId,
          programId: tcProgId,
        });
        console.log(`  ✓ Matière ajoutée : ${name}`);
      }
    }
  }

  // 5. Compte Administrateur initial (ESI - UNB)
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await db.insert(users).values({
      fullName: "Administrateur ESI - UNB",
      email: adminEmail,
      passwordHash,
      role: "admin",
      status: "validated",
      mustChangePassword: false,
    });
    console.log(`  ✓ Administrateur initial créé : ${adminEmail}`);
  } else {
    console.log(`  ℹ Administrateur déjà existant : ${adminEmail}`);
  }

  console.log("🎉 Peuplement terminé avec succès !");
}

seed()
  .catch((err) => {
    console.error("❌ Erreur lors du peuplement :", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
