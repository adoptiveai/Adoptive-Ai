import { Pool, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Auth routes that require database access will fail.');
}

let pool: Pool | null = null;

export const getPool = () => {
  if (!pool) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
};

export const query = async <T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
  const client = await getPool().connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
