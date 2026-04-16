import { TableClient, TableServiceClient } from '@azure/data-tables';
import { getEnv } from './env.js';

const created = new Set<string>();

export async function getTable(name: string): Promise<TableClient> {
  const conn = getEnv('TABLE_STORAGE_CONNECTION');
  const opts = conn.includes('UseDevelopmentStorage') ? { allowInsecureConnection: true } : {};
  if (!created.has(name)) {
    try {
      const svc = TableServiceClient.fromConnectionString(conn, opts);
      await svc.createTable(name);
    } catch (err: unknown) {
      const code = (err as { statusCode?: number; details?: { errorCode?: string } }).statusCode;
      const errCode = (err as { details?: { errorCode?: string } }).details?.errorCode;
      if (code !== 409 && errCode !== 'TableAlreadyExists') throw err;
    }
    created.add(name);
  }
  return TableClient.fromConnectionString(conn, name, opts);
}
