// Icones de navigation (traits fins, monochromes) partagees par les coquilles.
// Aucune couleur propre : elles heritent de `currentColor`.

import { cn } from '@/lib/utils';

export interface NavIconProps {
  className?: string;
}

function Base({ className, children }: NavIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-[18px] w-[18px]', className)}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Base>
  );
}

export function UsersIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7" />
      <path d="M17.5 20a5.5 5.5 0 0 0-3-4.9" />
    </Base>
  );
}

export function DocumentsIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <path d="M7 3h6l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </Base>
  );
}

export function ProposalsIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <path d="M5.5 4h13l3.5 7v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8Z" />
      <path d="M2 12h6l1.5 2.5h5L16 12h6" />
    </Base>
  );
}

export function ResetIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 4v5h-5" />
    </Base>
  );
}

export function LibraryIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </Base>
  );
}

export function UploadIcon({ className }: NavIconProps) {
  return (
    <Base className={className}>
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 19h14" />
    </Base>
  );
}
