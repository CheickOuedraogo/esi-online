// Indicateur de chargement plein ecran (verification de session, etc.).

import { Spinner } from '@/components/ui';

export function FullPageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-cream text-navy-500">
      <Spinner className="h-7 w-7 text-navy-400" label={label} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
