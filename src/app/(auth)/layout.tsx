// Layout de l'espace d'authentification : logo et carte centree.

import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy-50/60 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex justify-center rounded-xl transition-opacity hover:opacity-80 focus-visible:opacity-80"
          aria-label="Accueil ESI-Library"
        >
          <Image
            src="/logo.jpg"
            alt="ESI-Library"
            width={1075}
            height={976}
            priority
            className="h-24 w-auto rounded-xl bg-white object-contain shadow-sm"
          />
        </Link>
        {children}
      </div>
    </main>
  );
}