import type { EMAIL_SUBJECT } from './email.constant.js';

export type EmailSubject = (typeof EMAIL_SUBJECT)[keyof typeof EMAIL_SUBJECT];
export interface SendEmailOptions {
  to: string;
  subject: EmailSubject;
  html: string;
  text?: string;
}
