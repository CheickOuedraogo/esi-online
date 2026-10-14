import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectFileType,
  validateFile,
  validateFileHeader,
  sanitizeFilename,
} from "@/server/storage/file-validation";
import { LocalStorageProvider } from "@/server/storage/local.storage";
import {
  UnsupportedMediaTypeError,
  ValidationError,
  ForbiddenError,
} from "@/server/errors/http-errors";

describe("Stockage et Validation des Fichiers", () => {
  it("détecte correctement un document PDF via ses magic bytes (%PDF)", () => {
    const pdfBuffer = Buffer.from("%PDF-1.5 test content");
    const result = detectFileType(pdfBuffer, "cours.pdf");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.extension, "pdf");
  });

  it("détecte correctement une image PNG", () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01,
    ]);
    const result = detectFileType(pngHeader, "schema.png");
    assert.equal(result.mimeType, "image/png");
    assert.equal(result.extension, "png");
  });

  it("détecte correctement une archive ZIP et des documents DOCX/PPTX", () => {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);

    const docxResult = detectFileType(zipHeader, "rapport.docx");
    assert.equal(docxResult.extension, "docx");

    const pptxResult = detectFileType(zipHeader, "presentation.pptx");
    assert.equal(pptxResult.extension, "pptx");

    const zipResult = detectFileType(zipHeader, "code.zip");
    assert.equal(zipResult.extension, "zip");
  });

  it("rejette les exécutables ou formats non autorisés même avec une fausse extension", () => {
    const exeBuffer = Buffer.from("MZ fake executable content");
    assert.throws(
      () => detectFileType(exeBuffer, "virus.pdf"),
      (err: any) => err instanceof UnsupportedMediaTypeError
    );
  });

  it("rejette un fichier vide", () => {
    assert.throws(
      () => validateFile(Buffer.alloc(0), "empty.pdf"),
      (err: any) => err instanceof ValidationError
    );
  });

  it("nettoie les noms de fichiers originaux contre l'injection de chemins", () => {
    const dangerous = "../../../etc/passwd";
    const clean = sanitizeFilename(dangerous);
    assert.ok(!clean.includes("/"));
    assert.ok(!clean.includes("\\"));
    assert.ok(!clean.includes(".."));
  });

  it("protège contre la traversée de répertoires (path traversal)", () => {
    const provider = new LocalStorageProvider("./uploads");
    assert.rejects(
      async () => {
        await provider.get("../../etc/passwd");
      },
      (err: any) => err instanceof ForbiddenError
    );
  });

  it("valide un en-tête de fichier en streaming sans charger 50 Mo en RAM", () => {
    const header = Buffer.from("%PDF-1.4 header bytes only");
    const meta = validateFileHeader(header, "cours_reseaux.pdf", 15 * 1024 * 1024);
    assert.equal(meta.mimeType, "application/pdf");
    assert.equal(meta.extension, "pdf");
    assert.equal(meta.sizeBytes, 15 * 1024 * 1024);
    assert.ok(meta.storageKey.endsWith(".pdf"));
  });

  it("rejette un flux dépassant la taille maximale autorisée (MAX_UPLOAD_MB)", () => {
    const header = Buffer.from("%PDF-1.4 header bytes only");
    assert.throws(
      () => validateFileHeader(header, "trop_gros.pdf", 60 * 1024 * 1024),
      (err: any) => err.statusCode === 413
    );
  });
});
