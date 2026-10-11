// Middleware Next.js : PASS-THROUGH TEMPORAIRE (front).
// La protection reelle des routes /library, /proposals et /admin selon la session,
// le statut et le role est livree par l'equipe back dans cette meme fonction.
// Jusqu'a la, on laisse passer toutes les requetes sans bloquer.

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}