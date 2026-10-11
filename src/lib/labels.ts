// Libelles et variantes de couleur pour les statuts et roles affiches dans l'interface.

import type { UserRole, UserStatus } from '@/contracts/auth';
import type { DocumentStatus, Visibility } from '@/contracts/documents';
import type { BadgeVariant } from '@/components/ui/Badge';

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
};

export const USER_STATUS_VARIANT: Record<UserStatus, BadgeVariant> = {
  pending: 'amber',
  validated: 'green',
  rejected: 'red',
  suspended: 'gray',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Étudiant',
  admin: 'Administrateur',
};

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

export const DOCUMENT_STATUS_VARIANT: Record<DocumentStatus, BadgeVariant> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
};

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  public: 'Public',
  students: 'Étudiants',
};

export const VISIBILITY_VARIANT: Record<Visibility, BadgeVariant> = {
  public: 'navy',
  students: 'gold',
};

export function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
