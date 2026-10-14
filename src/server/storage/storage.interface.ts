// Interface d'abstraction du stockage de fichiers (local ou compatible S3).

import { Readable } from "stream";

export interface StorageProvider {
  /**
   * Enregistre un fichier à partir d'un flux.
   */
  put(stream: Readable, key: string, mimeType: string): Promise<void>;

  /**
   * Récupère un fichier sous forme de flux de lecture.
   */
  get(key: string): Promise<Readable>;

  /**
   * Supprime un fichier.
   */
  delete(key: string): Promise<void>;

  /**
   * Vérifie l'existence d'un fichier.
   */
  exists(key: string): Promise<boolean>;
}
