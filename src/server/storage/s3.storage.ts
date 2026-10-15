// Implémentation du stockage compatible S3 / Cloudflare R2 / MinIO (prévue pour évolution ultérieure).

import { Readable } from "stream";
import { StorageProvider } from "./storage.interface";
import { InternalServerError } from "@/server/errors/http-errors";

export class S3StorageProvider implements StorageProvider {
  async put(_stream: Readable, _key: string, _mimeType: string): Promise<void> {
    throw new InternalServerError("Le stockage S3 n'est pas encore configuré.");
  }

  async get(_key: string): Promise<Readable> {
    throw new InternalServerError("Le stockage S3 n'est pas encore configuré.");
  }

  async delete(_key: string): Promise<void> {
    throw new InternalServerError("Le stockage S3 n'est pas encore configuré.");
  }

  async exists(_key: string): Promise<boolean> {
    throw new InternalServerError("Le stockage S3 n'est pas encore configuré.");
  }
}
