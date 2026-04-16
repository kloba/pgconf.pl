interface HasHeaders {
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Resolve the client IP from headers SWA / Azure Functions normally provide.
 * Order: x-forwarded-for (first hop) -> x-azure-clientip -> x-client-ip -> "0.0.0.0".
 */
export function getClientIp(req: HasHeaders): string {
  const get = (name: string): string | undefined => {
    const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
    if (Array.isArray(raw)) return raw[0];
    return raw;
  };
  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const azure = get('x-azure-clientip');
  if (azure) return azure.trim();
  const generic = get('x-client-ip');
  if (generic) return generic.trim();
  return '0.0.0.0';
}
