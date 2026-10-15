// Implémentation du stockage sur le système de fichiers local avec protection
// contre les attaques par traversée de répertoires (path traversal).

import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { StorageProvider } from "./storage.interface";
import { env } from "@/server/config/env";
import { NotFoundError, ForbiddenError } from "@/server/errors/http-errors";

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir = env.UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
  }

  private resolveSafePath(key: string): string {
    // Nettoie les séparateurs et normalise
    const safeKey = key.replace(/^[/\\]+/, "");
    const resolved = path.resolve(this.baseDir, safeKey);

    // Vérifie que le chemin reste strictement dans le répertoire de base
    if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
      throw new ForbiddenError("Chemin de fichier interdit");
    }

    return resolved;
  }

  async put(stream: Readable, key: string, mimeType: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);
    const targetDir = path.dirname(targetPath);

    await fs.promises.mkdir(targetDir, { recursive: true });

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(stream, writeStream);
  }

  async get(key: string): Promise<Readable> {
    const targetPath = this.resolveSafePath(key);

    try {
      await fs.promises.access(targetPath, fs.constants.R_OK);
    } catch {
      throw new NotFoundError("Fichier introuvable sur le disque");
    }

    return fs.createReadStream(targetPath);
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);

    try {
      await fs.promises.unlink(targetPath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error(`Erreur lors de la suppression du fichier ${key}:`, err);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = this.resolveSafePath(key);
    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
