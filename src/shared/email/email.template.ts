// src/shared/email/email.template.ts

export const verificationEmailTemplate = (verificationUrl: string): string => {
  return `
    <h2>Verify your email</h2>

    <p>
      Please click the link below to verify your email.
    </p>

    <a href="${verificationUrl}">
      Verify Email
    </a>

    <p>
      This link expires in 30 minutes.
    </p>
  `;
};
