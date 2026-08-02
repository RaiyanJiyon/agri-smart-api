import type { ISendEmailOptions } from './email.interface.js';

const send = async (options: ISendEmailOptions): Promise<void> => {
  /**
   * Nodemailer / Resend implementation
   * will be added here.
   */
};

export const EmailService = {
  send,
};
