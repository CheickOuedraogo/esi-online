// Layout de l'administration : barre laterale et contenu reserve au role admin.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      <header className="border-b border-navy-100 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-navy-900">Administration</span>
      </header>
      <div className="flex-1 px-6 py-8">{children}</div>
    </main>
  );
}