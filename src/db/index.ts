import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const configuredDatabaseUrl = process.env.DATABASE_URL?.trim();

// Keep module import safe during build and CI shape checks. Any query attempted
// without DATABASE_URL will fail against this local placeholder and be surfaced
// by the caller as an unavailable database, rather than crashing the bundle.
const connectionString = configuredDatabaseUrl || 'postgres://filex:missing@127.0.0.1:5432/filex';
const requestedPoolSize = Number.parseInt(process.env.DATABASE_POOL_MAX ?? '1', 10);
const poolSize = Number.isFinite(requestedPoolSize)
  ? Math.min(Math.max(requestedPoolSize, 1), 10)
  : 1;

export const databaseConfigured = Boolean(configuredDatabaseUrl);

const client = postgres(connectionString, {
  // Supabase transaction poolers and serverless runtimes should not retain
  // prepared statements or unbounded idle connections between invocations.
  prepare: false,
  max: poolSize,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;

export async function closeDatabase(): Promise<void> {
  await client.end({ timeout: 5 });
}
