// Contrats d'authentification : inscription, connexion, demande de réinitialisation,
// changement de mot de passe, utilisateur courant.

import { z } from "zod";

// ── Énumérations ────────────────────────────────────────────────────────────

export const Role = { STUDENT: "student", ADMIN: "admin" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  PENDING: "pending",
  VALIDATED: "validated",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// ── Inscription ─────────────────────────────────────────────────────────────

export const registerInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  email: z.string().trim().email("Email invalide").toLowerCase(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
  programId: z.string().uuid("Filière invalide"),
  levelId: z.string().uuid("Niveau invalide"),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

// ── Connexion ───────────────────────────────────────────────────────────────

export const loginInputSchema = z.object({
  email: z.string().trim().email("Email invalide").toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// ── Changement de mot de passe ──────────────────────────────────────────────

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
    .max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// ── Demande de réinitialisation ─────────────────────────────────────────────

export const requestResetInputSchema = z.object({
  email: z.string().trim().email("Email invalide").toLowerCase(),
});

export type RequestResetInput = z.infer<typeof requestResetInputSchema>;

// ── Utilisateur public (réponse) ────────────────────────────────────────────

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "admin"]),
  status: z.enum(["pending", "validated", "rejected", "suspended"]),
  mustChangePassword: z.boolean(),
  programId: z.string().uuid().nullable(),
  levelId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type UserPublic = z.infer<typeof userPublicSchema>;

// ── Réponse de connexion ────────────────────────────────────────────────────

export const loginResponseSchema = z.object({
  user: userPublicSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
