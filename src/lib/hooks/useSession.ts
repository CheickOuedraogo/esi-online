'use client';

// Hook de garde d'acces : charge l'utilisateur courant et redirige selon son
// role et son statut (invite -> /login, mauvais role -> espace correspondant).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/contracts/auth';
import { me } from '@/lib/api-client/auth';

export function useRequireRole(role: 'student' | 'admin'): { user: AuthUser | null; ready: boolean } {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    me()
      .then((current) => {
        if (!active) return;
        if (current.mustChangePassword) {
          router.replace('/change-password');
          return;
        }
        if (role === 'admin' && current.role !== 'admin') {
          router.replace('/library');
          return;
        }
        if (role === 'student') {
          if (current.role === 'admin') {
            router.replace('/admin');
            return;
          }
          if (current.status === 'pending' || current.status === 'rejected') {
            router.replace('/pending');
            return;
          }
        }
        setUser(current);
        setReady(true);
      })
      .catch(() => {
        if (active) router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [role, router]);

  return { user, ready };
}
