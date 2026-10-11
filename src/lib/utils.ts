// Utilitaires front generiques (fusion de classes, helpers divers).

export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string | number => Boolean(value)).join(' ');
}
