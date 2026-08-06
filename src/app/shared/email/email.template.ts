export const verificationEmailTemplate = (verificationUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification - AgriSmart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header / Brand -->
          <tr>
            <td style="padding: 32px 40px 20px 40px; text-align: left;">
              <h2 style="margin: 0; font-size: 24px; color: #111827; font-weight: 700;">
                AgriSmart 🌱
              </h2>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: left;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.5;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.5;">
                Thank you for signing up for AgriSmart! Please verify your email address by clicking the button below to get started.
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #16a34a;">
                    <a href="${verificationUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #16a34a; display: inline-block; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
                This verification link expires in <strong>30 minutes</strong>.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.4;">
                If you didn't create an account with AgriSmart, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} AgriSmart. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
