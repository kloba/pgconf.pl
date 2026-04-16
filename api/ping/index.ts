interface FuncContext {
  log: { (msg: unknown): void; error: (msg: unknown) => void };
  res?: { status: number; headers?: Record<string, string>; body: string };
}

export default async function (context: FuncContext): Promise<void> {
  context.log('ping invoked');
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, runtime: process.version, ts: new Date().toISOString() }),
  };
}
