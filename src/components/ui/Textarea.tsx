// Zone de texte multiligne reutilisable.

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError = false, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-300',
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
