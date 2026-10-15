// Lien d'evitement : permet aux utilisateurs au clavier d'atteindre directement le contenu.

export function SkipLink() {
  return (
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-navy-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-cream focus:shadow-lg"
    >
      Aller au contenu
    </a>
  );
}
