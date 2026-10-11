// Pied de page du site : mentions et appartenance.

export function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm font-medium text-navy-600">ESI-Library</p>
        <p className="text-center text-xs text-navy-400 sm:text-right">
          École Supérieure d&apos;Informatique (ESI) · Université Nazi Boni, Bobo-Dioulasso ·
          &copy; 2026
        </p>
      </div>
    </footer>
  );
}