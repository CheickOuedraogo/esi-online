// Middleware Next.js : protège les routes selon la présence du cookie de session httpOnly.
// Redirige vers /login si le cookie est absent lors d'une tentative d'accès aux routes privées.
// Les vérifications complètes (rôle, statut du compte, mot de passe temporaire) sont assurées
// de manière stricte par les gardes serveur (server/auth/guards.ts) dans chaque route et service.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("esi_session");

  // Routes protégées nécessitant au minimum une session active
  const protectedPrefixes = ["/admin", "/library", "/proposals"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/library/:path*",
    "/proposals/:path*",
  ],
};
