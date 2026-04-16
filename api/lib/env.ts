export function getEnv(name: string, required?: true): string;
export function getEnv(name: string, required: false): string | undefined;
export function getEnv(name: string, required = true): string | undefined {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (required) throw new Error(`Missing required env var: ${name}`);
  return undefined;
}
