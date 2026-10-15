// Champ de formulaire reutilisable (label, erreur, texte d'aide).
// Enrichit automatiquement le controle enfant avec `aria-describedby`
// (message d'erreur / texte d'aide) et `aria-required`.

import { Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const describedBy =
    [error ? `${id}-error` : null, !error && hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  let control = children;
  const onlyChild = Children.count(children) === 1 ? Children.only(children) : null;
  if (isValidElement(onlyChild)) {
    const existing = (onlyChild.props as { 'aria-describedby'?: string })['aria-describedby'];
    const merged = [existing, describedBy].filter(Boolean).join(' ') || undefined;
    control = cloneElement(onlyChild as React.ReactElement<Record<string, unknown>>, {
      'aria-describedby': merged,
      'aria-required': required || undefined,
    });
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-navy-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
