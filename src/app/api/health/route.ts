// GET - Vérifie l'état de l'application et la connexion à PostgreSQL.
// Entrée : aucune. Sortie : { status: "ok" } (200) ou { status: "degraded", error } (503).
// Service : pool.query('SELECT 1'). Rôle : public.

import { NextResponse } from "next/server";
import { pool } from "@/server/db/client";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Healthcheck error:", error);
    return NextResponse.json(
      { status: "degraded", message: "Database connection failed" },
      { status: 503 }
    );
  }
}
