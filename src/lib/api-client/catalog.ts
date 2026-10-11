// Fonctions d'appel a l'API catalogue (niveaux, filieres, matieres, types).

import type { CatalogResponse } from '@/contracts/catalog';
import { apiFetch } from './client';

export function getCatalog(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>('/api/catalog');
}
