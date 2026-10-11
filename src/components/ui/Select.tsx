// Liste de selection reutilisable.

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError = false, placeholder, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full appearance-none rounded-lg border bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        hasError
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-navy-200 focus:border-navy-400 focus:ring-navy-200',
        'disabled:cursor-not-allowed disabled:bg-navy-50',
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
});