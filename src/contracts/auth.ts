// Contrats d'authentification : inscription, connexion, demande de reinitialisation, changement de mot de passe, utilisateur courant.

import { z } from 'zod';
import { uuidSchema } from './common';

export const userRoleSchema = z.enum(['student', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(['pending', 'validated', 'rejected', 'suspended']);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse e-mail invalide.");

export const registerInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caracteres.')
    .max(120, 'Le nom est trop long.'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres.')
    .max(200, 'Le mot de passe est trop long.'),
  programId: uuidSchema,
  levelId: uuidSchema,
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const requestResetInputSchema = z.object({
  email: emailSchema,
});

export type RequestResetInput = z.infer<typeof requestResetInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caracteres.')
    .max(200, 'Le mot de passe est trop long.'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const authUserSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
  programId: uuidSchema.nullable(),
  levelId: uuidSchema.nullable(),
  createdAt: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  id: uuidSchema,
  role: userRoleSchema,
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
