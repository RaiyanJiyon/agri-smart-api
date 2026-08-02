export const verificationEmailTemplate = (verificationUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif;">
  <h2>Welcome to AgriSmart 🌱</h2>

  <p>
    Please verify your email address by clicking the button below.
  </p>

  <p>
    <a
      href="${verificationUrl}"
      style="
        background:#16a34a;
        color:white;
        padding:12px 24px;
        text-decoration:none;
        border-radius:6px;
      "
    >
      Verify Email
    </a>
  </p>

  <p>
    This link expires in <strong>30 minutes</strong>.
  </p>

  <p>
    If you didn't create this account, you can safely ignore this email.
  </p>
</body>
</html>
`;
