/**
 * v3 model response shape — assign to `context.res` in handlers.
 */
export interface FuncResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const baseHeaders: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function ok<T>(body: T): FuncResponse {
  return {
    status: 200,
    headers: { ...baseHeaders },
    body: JSON.stringify({ ok: true, ...(body as Record<string, unknown>) }),
  };
}

export function bad(status: number, error: string): FuncResponse {
  return {
    status,
    headers: { ...baseHeaders },
    body: JSON.stringify({ ok: false, error }),
  };
}
