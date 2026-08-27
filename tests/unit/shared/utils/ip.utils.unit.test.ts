import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { anonymizeIp, getClientIp } from '../../../../src/app/shared/utils/ip.utils.js';

describe('ip.utils', () => {
  describe('getClientIp', () => {
    it('should extract standard IPv4 address', () => {
      const req = { ip: '192.168.1.50' } as Request;
      expect(getClientIp(req)).toBe('192.168.1.50');
    });

    it('should normalize IPv6-mapped IPv4 address', () => {
      const req = { ip: '::ffff:10.0.0.1' } as Request;
      expect(getClientIp(req)).toBe('10.0.0.1');
    });

    it('should convert loopback IPv6 (::1) to 127.0.0.1', () => {
      const req = { ip: '::1' } as Request;
      expect(getClientIp(req)).toBe('127.0.0.1');
    });

    it('should fallback to remoteAddress when req.ip is undefined', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: '172.16.0.5' },
      } as unknown as Request;

      expect(getClientIp(req)).toBe('172.16.0.5');
    });

    it('should fallback to 127.0.0.1 when both ip and remoteAddress are missing or empty', () => {
      const req = { ip: '   ' } as Request;
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('anonymizeIp', () => {
    it('should anonymize last octet of an IPv4 address', () => {
      expect(anonymizeIp('192.168.1.45')).toBe('192.168.1.0');
    });

    it('should anonymize host portion of an IPv6 address', () => {
      expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3::');
    });

    it('should return 0.0.0.0 when given invalid or unrecognized string', () => {
      expect(anonymizeIp('invalid-ip')).toBe('0.0.0.0');
    });
  });
});
