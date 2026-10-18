// Script de peuplement de la base de données :
// Niveaux, types de documents, compte administrateur initial,
// puis jeu de données de démonstration (étudiants, documents, propositions) si la base est vide.
// L'ESI est une école unique : pas de filière, la matière est un texte libre.

import { Readable } from "stream";
import { eq, count } from "drizzle-orm";
import { db, pool } from "./client";
import {
  levels,
  documentTypes,
  users,
  documents,
  passwordResetRequests,
} from "./schema";
import { env } from "@/server/config/env";
import { hashPassword } from "@/server/auth/password";
import { storage, validateFile } from "@/server/storage";

// Génère un petit PDF valide (une page) contenant un titre, pour les données de démo.
function makeDemoPdf(title: string): Buffer {
  const content = `BT /F1 20 Tf 50 780 Td (${title.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

// Écrit un PDF de démo dans le stockage et renvoie les métadonnées de fichier.
async function storeDemoPdf(
  originalFilename: string,
  title: string
): Promise<{
  fileKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const buffer = makeDemoPdf(title);
  const meta = validateFile(buffer, originalFilename);
  await storage.put(Readable.from(buffer), meta.storageKey, meta.mimeType);
  return {
    fileKey: meta.storageKey,
    originalFilename: meta.originalFilename,
    mimeType: meta.mimeType,
    sizeBytes: meta.sizeBytes,
  };
}

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

  // 2. Types de documents (cours, TD, TP, examen, corrigé, mémoire, autre)
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

  // 3. Compte Administrateur initial (ESI - UNB)
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

  // 4. Jeu de données de démonstration (uniquement si aucun document n'existe)
  const [{ total: existingDocCount }] = await db
    .select({ total: count() })
    .from(documents);

  if (existingDocCount === 0) {
    const typeRows = await db.select().from(documentTypes);
    const findType = (name: string) => typeRows.find((t) => t.name === name)?.id;

    const demoLevelId = levelMap.get("L1") ?? null;
    const demoPasswordHash = await hashPassword("Etudiant123!");

    const [demoStudent] = await db
      .insert(users)
      .values({
        fullName: "Étudiant Démo",
        email: "etudiant@esi.bf",
        passwordHash: demoPasswordHash,
        role: "student",
        status: "validated",
        mustChangePassword: false,
        levelId: demoLevelId,
      })
      .returning();
    console.log("  ✓ Étudiant de démonstration : etudiant@esi.bf / Etudiant123!");

    const [pendingStudent] = await db
      .insert(users)
      .values({
        fullName: "Awa Traoré",
        email: "awa.traore@esi.bf",
        passwordHash: demoPasswordHash,
        role: "student",
        status: "pending",
        levelId: demoLevelId,
      })
      .returning();
    console.log("  ✓ Étudiant en attente : awa.traore@esi.bf");

    const approvedDocs: Array<{
      title: string;
      subject: string;
      type: string;
      visibility: "public" | "students";
      academicYear: number;
      downloadCount: number;
    }> = [
      {
        title: "Technologies Web et Internet — Cours complet",
        subject: "Technologies Web et Internet",
        type: "cours",
        visibility: "public",
        academicYear: 2025,
        downloadCount: 42,
      },
      {
        title: "Algorithmique — TD 1 et corrigé",
        subject: "Algorithmique et Structures de Données 1",
        type: "TD",
        visibility: "students",
        academicYear: 2025,
        downloadCount: 17,
      },
      {
        title: "Analyse Mathématique — Examen 2024",
        subject: "Analyse Mathématique",
        type: "examen",
        visibility: "students",
        academicYear: 2024,
        downloadCount: 8,
      },
      {
        title: "Systèmes d'Exploitation 1 — TP 3 (processus)",
        subject: "Systèmes d'Exploitation 1",
        type: "TP",
        visibility: "students",
        academicYear: 2024,
        downloadCount: 3,
      },
    ];

    let approvedCount = 0;
    for (const doc of approvedDocs) {
      const typeId = findType(doc.type);
      if (!typeId) continue;

      const file = await storeDemoPdf(`${doc.title}.pdf`, doc.title);
      await db.insert(documents).values({
        title: doc.title,
        description: `Document de démonstration : ${doc.title}.`,
        subject: doc.subject,
        typeId,
        levelId: demoLevelId,
        academicYear: doc.academicYear,
        visibility: doc.visibility,
        status: "approved",
        publishedAt: new Date(),
        uploadedBy: demoStudent.id,
        downloadCount: doc.downloadCount,
        ...file,
      });
      approvedCount += 1;
    }
    console.log(`  ✓ ${approvedCount} documents publiés`);

    const proposalDocs = [
      {
        title: "Algèbre Linéaire — Fiche de révision",
        subject: "Algèbre Linéaire",
        type: "autre",
        academicYear: 2025,
      },
      {
        title: "Architecture des Ordinateurs — Annales 2024",
        subject: "Architecture des Ordinateurs",
        type: "examen",
        academicYear: 2024,
      },
    ];

    let proposalCount = 0;
    for (const proposal of proposalDocs) {
      const typeId = findType(proposal.type);
      if (!typeId) continue;

      const file = await storeDemoPdf(`${proposal.title}.pdf`, proposal.title);
      await db.insert(documents).values({
        title: proposal.title,
        description: `Proposition de démonstration : ${proposal.title}.`,
        subject: proposal.subject,
        typeId,
        levelId: demoLevelId,
        academicYear: proposal.academicYear,
        visibility: "students",
        status: "pending",
        uploadedBy: demoStudent.id,
        ...file,
      });
      proposalCount += 1;
    }
    console.log(`  ✓ ${proposalCount} propositions en attente`);

    await db.insert(passwordResetRequests).values({
      userId: pendingStudent.id,
      status: "pending",
    });
    console.log("  ✓ 1 demande de réinitialisation en attente");
  } else {
    console.log("  ℹ Données de démonstration déjà présentes (documents existants)");
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
