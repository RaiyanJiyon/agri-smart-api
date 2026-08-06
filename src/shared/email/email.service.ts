import { Resend } from 'resend';
import type { SendEmailOptions } from './email.interface.js';
import { config } from '../../config/env.js';

const resend = new Resend(config.RESEND_API_KEY);

const send = async ({ to, subject, html, text }: SendEmailOptions): Promise<void> => {
  await resend.emails.send({
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
};

export const EmailService = {
  send,
};
