'use client';

// Champ mot de passe avec bouton « œil » pour afficher/masquer la saisie.

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  hasError?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, hasError = false, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        aria-invalid={hasError || undefined}
        className={cn(
          'h-10 w-full rounded-lg border bg-white pl-3 pr-10 text-sm text-navy-900 placeholder:text-navy-300',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-navy-200 focus:border-navy-400 focus:ring-navy-200',
          'disabled:cursor-not-allowed disabled:bg-navy-50',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-navy-400 transition-colors hover:text-navy-700 focus:outline-none"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
            <path d="M9.9 5.1A9.8 9.8 0 0112 5c5 0 8.5 4 9.5 7a12 12 0 01-2 3.1M6.1 6.1C4.2 7.4 2.9 9.2 2.5 12c1 3 4.5 7 9.5 7a9.6 9.6 0 003.3-.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
            <path d="M2.5 12c1-3 4.5-7 9.5-7s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7Z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
});
