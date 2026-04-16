import type { HttpRequest } from '@azure/functions';

/**
 * Resolve the client IP from headers SWA / Azure Functions normally provide.
 * Order: x-forwarded-for (first hop) -> x-azure-clientip -> x-client-ip -> "0.0.0.0".
 */
export function getClientIp(req: HttpRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const azure = req.headers.get('x-azure-clientip');
  if (azure) return azure.trim();
  const generic = req.headers.get('x-client-ip');
  if (generic) return generic.trim();
  return '0.0.0.0';
}
