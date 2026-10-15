// Page provisoire "en construction" pour les sections pas encore livrees.

export interface UnderConstructionProps {
  title: string;
  description?: string;
}

export function UnderConstruction({ title, description }: UnderConstructionProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-semibold text-navy-900">{title}</h1>
      <p className="max-w-md text-sm text-navy-600">
        {description ?? 'Cette section est en cours de construction.'}
      </p>
    </section>
  );
}