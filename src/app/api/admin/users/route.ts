// GET - Liste des utilisateurs avec filtres et recherche pour les administrateurs.
// POST - Création directe d'un compte utilisateur par un administrateur.
// Services : usersService.listUsers / usersService.createUserAdmin. Rôle : admin.

import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/server/utils/api-handler";
import { adminUserFiltersSchema } from "@/contracts/admin";
import { usersService } from "@/server/services/users.service";
import { requireAdmin } from "@/server/auth/guards";

const adminCreateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).optional(),
  role: z.enum(["student", "admin"]).default("student"),
  status: z.enum(["pending", "validated", "rejected", "suspended"]).default("validated"),
  levelId: z.string().uuid().nullable().optional(),
  programId: z.string().uuid().nullable().optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const filters = adminUserFiltersSchema.parse(rawParams);

  const result = await usersService.listUsers(filters);
  return Response.json(result, { status: 200 });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();
  const input = adminCreateUserSchema.parse(body);

  const createdUser = await usersService.createUserAdmin(input);
  return Response.json(createdUser, { status: 201 });
});
