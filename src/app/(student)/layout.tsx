// Layout de l'espace etudiant : en-tete et navigation pour un utilisateur authentifie et valide.

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      <header className="border-b border-navy-100 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-navy-900">Espace étudiant</span>
      </header>
      <div className="flex-1 px-6 py-8">{children}</div>
    </main>
  );
}