// Fabrique et instance singleton du stockage de fichiers.

import { StorageProvider } from "./storage.interface";
import { LocalStorageProvider } from "./local.storage";

export * from "./storage.interface";
export * from "./local.storage";
export * from "./file-validation";

export const storage: StorageProvider = new LocalStorageProvider();
