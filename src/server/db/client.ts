// Client Drizzle/Postgres : pool de connexions et instance db typée avec schéma.

import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "@/server/config/env";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __db: NodePgDatabase<typeof schema> | undefined;
}

const pool =
  global.__dbPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });

export const db = global.__db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = pool;
  global.__db = db;
}

export { pool };
