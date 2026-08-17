import type { Request } from 'express';

/**
 * Safely extracts and normalizes the client's real IP address from the Express request.
 * Takes into account `app.set('trust proxy', 1)` configuration in `app.ts`.
 */
export const getClientIp = (req: Request): string => {
  let ip = req.ip ?? req.socket?.remoteAddress ?? '127.0.0.1';

  // Normalize IPv6-mapped IPv4 addresses (e.g. "::ffff:192.168.1.1" -> "192.168.1.1")
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Handle loopback IPv6 notation
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  const trimmed = ip.trim();
  return trimmed !== '' ? trimmed : '127.0.0.1';
};

/**
 * Anonymizes an IP address for GDPR / privacy-compliant logging.
 * Masks the last octet for IPv4 or the host portion for IPv6.
 */
export const anonymizeIp = (ip: string): string => {
  const normalized = getClientIp({ ip } as Request);

  // IPv4 anonymization (e.g. 192.168.1.45 -> 192.168.1.0)
  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }

  // IPv6 anonymization (e.g. 2001:db8:85a3:8d3:1319:8a2e:370:7348 -> 2001:db8:85a3::)
  if (normalized.includes(':')) {
    const parts = normalized.split(':');
    if (parts.length >= 3) {
      return `${parts.slice(0, 3).join(':')}::`;
    }
  }

  return '0.0.0.0';
};
