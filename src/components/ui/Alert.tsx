// Message d'alerte : erreur, succes ou information.

import { cn } from '@/lib/utils';

export type AlertVariant = 'error' | 'success' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const VARIANTS: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-navy-200 bg-navy-50 text-navy-700',
};

export function Alert({ className, variant = 'info', role, ...props }: AlertProps) {
  return (
    <div
      role={role ?? (variant === 'error' ? 'alert' : 'status')}
      className={cn('rounded-lg border px-3 py-2 text-sm', VARIANTS[variant], className)}
      {...props}
    />
  );
}
