import { describe, expect, it, vi } from 'vitest';
import { EmailService } from '../../../../src/app/shared/email/email.service.js';

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
      };
    },
  };
});

describe('EmailService', () => {
  it('should send email via Resend successfully with HTML and plain text', async () => {
    await expect(
      EmailService.send({
        to: 'user@example.com',
        subject: 'Welcome to Agri Smart',
        html: '<p>Welcome!</p>',
        text: 'Welcome!',
      })
    ).resolves.toBeUndefined();
  });
});
