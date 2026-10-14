// Validation des fichiers téléversés : formats autorisés via magic bytes (signature réelle),
// taille maximale autorisée et génération des clés de stockage sécurisées.

import crypto from "crypto";
import path from "path";
import {
  ValidationError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from "@/server/errors/http-errors";
import { env } from "@/server/config/env";

export interface ValidatedFileMeta {
  mimeType: string;
  extension: string;
  sizeBytes: number;
  originalFilename: string;
  storageKey: string;
}

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function generateStorageKey(extension: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const fileUuid = crypto.randomUUID();
  const ext = extension.replace(/^\./, "").toLowerCase();
  return `${year}/${month}/${fileUuid}.${ext}`;
}

export function detectFileType(
  buffer: Buffer,
  originalFilename: string
): { mimeType: string; extension: string } {
  if (buffer.length < 4) {
    throw new UnsupportedMediaTypeError("Fichier invalide ou corrompu");
  }

  // PDF : %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { mimeType: "application/pdf", extension: "pdf" };
  }

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  // JPEG / JPG : FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // ZIP ou conteneur OpenXML (DOCX, PPTX) : PK.. (50 4B 03 04 ou 50 4B 05 06)
  if (
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) ||
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x05 && buffer[3] === 0x06)
  ) {
    const ext = path.extname(originalFilename).toLowerCase();
    if (ext === ".docx") {
      return {
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
      };
    }
    if (ext === ".pptx") {
      return {
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extension: "pptx",
      };
    }
    return { mimeType: "application/zip", extension: "zip" };
  }

  throw new UnsupportedMediaTypeError(
    "Format de fichier non autorisé. Formats acceptés : PDF, DOCX, PPTX, JPG, PNG, ZIP."
  );
}

export function validateFile(
  buffer: Buffer,
  originalFilename: string
): ValidatedFileMeta {
  if (buffer.length === 0) {
    throw new ValidationError("Le fichier ne peut pas être vide");
  }

  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new PayloadTooLargeError(
      `Le fichier dépasse la taille maximale autorisée (${env.MAX_UPLOAD_MB} Mo)`
    );
  }

  const sanitized = sanitizeFilename(originalFilename);
  const { mimeType, extension } = detectFileType(buffer, sanitized);
  const storageKey = generateStorageKey(extension);

  return {
    mimeType,
    extension,
    sizeBytes: buffer.length,
    originalFilename: sanitized,
    storageKey,
  };
}

/**
 * Valide un fichier à partir de ses premiers octets (magic bytes) et de sa taille déclarée,
 * sans nécessiter de charger l'intégralité du fichier (jusqu'à 50 Mo) en mémoire RAM.
 */
export function validateFileHeader(
  headerBuffer: Buffer,
  originalFilename: string,
  declaredSize?: number
): ValidatedFileMeta {
  if (declaredSize !== undefined) {
    if (declaredSize === 0) {
      throw new ValidationError("Le fichier ne peut pas être vide");
    }
    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (declaredSize > maxBytes) {
      throw new PayloadTooLargeError(
        `Le fichier dépasse la taille maximale autorisée (${env.MAX_UPLOAD_MB} Mo)`
      );
    }
  }

  if (headerBuffer.length === 0) {
    throw new ValidationError("Le fichier ne peut pas être vide");
  }

  const sanitized = sanitizeFilename(originalFilename);
  const { mimeType, extension } = detectFileType(headerBuffer, sanitized);
  const storageKey = generateStorageKey(extension);

  return {
    mimeType,
    extension,
    sizeBytes: declaredSize ?? headerBuffer.length,
    originalFilename: sanitized,
    storageKey,
  };
}

