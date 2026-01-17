// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __grahaliaPool: Pool | undefined;
}

const pool =
  global.__grahaliaPool ??
  new Pool({
    connectionString,
  });

global.__grahaliaPool = pool;

export const db = drizzle(pool);
