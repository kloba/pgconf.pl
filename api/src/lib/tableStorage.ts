import { TableClient, TableServiceClient } from '@azure/data-tables';
import { getEnv } from './env.js';

const ensured = new Set<string>();

/**
 * Return a TableClient for `name`, auto-creating the table on first call.
 * Uses the TABLE_STORAGE_CONNECTION env var.
 */
export async function getTable(name: string): Promise<TableClient> {
  const connectionString = getEnv('TABLE_STORAGE_CONNECTION');

  if (!ensured.has(name)) {
    const service = TableServiceClient.fromConnectionString(connectionString, {
      allowInsecureConnection: connectionString.includes('UseDevelopmentStorage=true'),
    });
    try {
      await service.createTable(name);
    } catch (err) {
      const code = (err as { statusCode?: number; code?: string })?.statusCode;
      const errCode = (err as { code?: string })?.code;
      if (code !== 409 && errCode !== 'TableAlreadyExists') {
        throw err;
      }
    }
    ensured.add(name);
  }

  return TableClient.fromConnectionString(connectionString, name, {
    allowInsecureConnection: connectionString.includes('UseDevelopmentStorage=true'),
  });
}
