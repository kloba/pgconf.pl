/**
 * Read an environment variable.
 * @param name - The variable name.
 * @param required - Whether to throw if the variable is missing or empty. Defaults to true.
 * @returns The value, or undefined when not required and unset.
 */
export function getEnv(name: string, required?: true): string;
export function getEnv(name: string, required: false): string | undefined;
export function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return undefined;
  }
  return value;
}
