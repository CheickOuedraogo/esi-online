'use client';

// Demarre le service worker MSW cote client lorsque les mocks sont actifs.
// Actif si NEXT_PUBLIC_API_MOCKING === 'enabled', ou par defaut hors production
// tant que NEXT_PUBLIC_API_MOCKING n'est pas explicitement 'disabled'.

import { useEffect, useState } from 'react';

function mocksEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') return true;
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'disabled') return false;
  return process.env.NODE_ENV !== 'production';
}

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!mocksEnabled());

  useEffect(() => {
    if (!mocksEnabled()) return;
    let active = true;
    void (async () => {
      const { worker } = await import('./browser');
      await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {children}
      {!ready && (
        <span className="sr-only" role="status">
          Initialisation des données de démonstration…
        </span>
      )}
    </>
  );
}
