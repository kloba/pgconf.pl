import type { HttpResponseInit } from '@azure/functions';

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
} as const;

export function ok<T>(body: T): HttpResponseInit {
  return {
    status: 200,
    headers: { ...baseHeaders },
    jsonBody: { ok: true, ...(body as Record<string, unknown>) },
  };
}

export function bad(status: number, error: string): HttpResponseInit {
  return {
    status,
    headers: { ...baseHeaders },
    jsonBody: { ok: false, error },
  };
}
