// Champ de saisie reutilisable.

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
        hasError
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-navy-200 focus:border-navy-400 focus:ring-navy-200',
        'disabled:cursor-not-allowed disabled:bg-navy-50',
        className,
      )}
      {...props}
    />
  );
});
