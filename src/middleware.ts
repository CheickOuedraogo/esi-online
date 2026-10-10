// Middleware Next.js : protege les routes /library, /proposals et /admin selon le statut de la
// session (cookie httpOnly) et le role. Redirige vers /login si non authentifie, vers /pending si
// le compte n'est pas encore valide, vers /change-password si un mot de passe temporaire doit etre
// change, et renvoie 403 si le role est insuffisant.

export {};
