'use client';

// Fenetre modale accessible : fond assombri, fermeture au clic exterieur et a la touche Echap.

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, className, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer la fenetre"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-950/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-navy-100 bg-white shadow-xl shadow-navy-950/10',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
