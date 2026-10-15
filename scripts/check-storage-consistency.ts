// Script de contrôle de cohérence du stockage :
// - Liste les fichiers sur le disque sans ligne correspondante en base de données (orphelins physiques)
// - Liste les enregistrements de documents en base sans fichier correspondant sur le disque (orphelins logiques)

import fs from "fs";
import path from "path";
import { db, pool } from "@/server/db/client";
import { documents } from "@/server/db/schema";
import { env } from "@/server/config/env";

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  if (!fs.existsSync(dirPath)) return [];
  const files = await fs.promises.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.promises.stat(fullPath);
    if (stat.isDirectory()) {
      await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

async function checkConsistency() {
  console.log("🔍 Vérification de la cohérence du stockage des documents...");

  const baseUploadDir = path.resolve(env.UPLOAD_DIR);
  const diskFiles = await getAllFiles(baseUploadDir);

  // Clés relatives telles qu'enregistrées en base (avec des /)
  const diskKeys = diskFiles.map((f) =>
    path.relative(baseUploadDir, f).split(path.sep).join("/")
  );

  const dbRows = await db
    .select({ id: documents.id, fileKey: documents.fileKey })
    .from(documents);

  const dbKeys = new Set(dbRows.map((r) => r.fileKey));
  const diskKeySet = new Set(diskKeys);

  // 1. Fichiers sur le disque sans enregistrement en base
  const diskOrphans = diskKeys.filter((k) => !dbKeys.has(k));

  // 2. Enregistrements en base sans fichier sur le disque
  const dbOrphans = dbRows.filter((r) => !diskKeySet.has(r.fileKey));

  console.log(`\n📊 Résultats de l'audit :`);
  console.log(`- Fichiers physiques détectés : ${diskKeys.length}`);
  console.log(`- Documents en base : ${dbRows.length}`);

  if (diskOrphans.length > 0) {
    console.warn(`\n⚠️ ${diskOrphans.length} fichier(s) sur le disque sans ligne en base :`);
    diskOrphans.forEach((k) => console.warn(`   - ${k}`));
  } else {
    console.log("✓ Aucun fichier orphelin sur le disque.");
  }

  if (dbOrphans.length > 0) {
    console.error(`\n❌ ${dbOrphans.length} document(s) en base sans fichier sur le disque :`);
    dbOrphans.forEach((r) => console.error(`   - ID: ${r.id} -> Clé: ${r.fileKey}`));
  } else {
    console.log("✓ Aucun document orphelin en base.");
  }
}

checkConsistency()
  .catch((err) => {
    console.error("Erreur lors de l'audit :", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
