// Utilitaires de texte côté serveur.

// Tronque un texte long pour alléger les réponses de liste (bande passante).
// Les vues de détail continuent d'exposer le texte complet.
export function truncateText(value: string | null, max = 280): string | null {
  if (value == null) return null;
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}
