interface envConfig {
  PORT: number;
  CLIENT_URL: string[];
  DB_URL: string;
  NODE_ENV: string;
  ARGON2_MEMORY: number;
  ARGON2_TIME: number;
  ARGON2_PARALLELISM: number;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  EMAIL_VERIFICATION_EXPIRES_IN: string;
  PASSWORD_RESET_EXPIRES_IN: string;

  JWT: {
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
  };

  GEMINI: {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
  };
}

const loadEnvVariables = (): envConfig => {
  const requiredEnvVariables: string[] = [
    'PORT',
    'CLIENT_URL',
    'DB_URL',
    'NODE_ENV',
    'ARGON2_MEMORY',
    'ARGON2_TIME',
    'ARGON2_PARALLELISM',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'JWT_ACCESS_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
    'EMAIL_VERIFICATION_EXPIRES_IN',
    'PASSWORD_RESET_EXPIRES_IN',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
  });

  // Parse and strictly validate Argon2 numeric values
  const argonMemory = Number(process.env.ARGON2_MEMORY);
  if (!Number.isInteger(argonMemory) || argonMemory < 65536) {
    throw new Error('ARGON2_MEMORY must be a valid integer ≥ 65536 (64MB)');
  }

  const argonTime = Number(process.env.ARGON2_TIME);
  if (!Number.isInteger(argonTime) || argonTime < 1) {
    throw new Error('ARGON2_TIME must be a valid integer ≥ 1');
  }

  const argonParallelism = Number(process.env.ARGON2_PARALLELISM);
  if (!Number.isInteger(argonParallelism) || argonParallelism < 1) {
    throw new Error('ARGON2_PARALLELISM must be a valid integer ≥ 1');
  }

  return {
    PORT: Number(process.env.PORT!),
    CLIENT_URL: process.env.CLIENT_URL!.split(',').map((url) => url.trim()), // Split by comma and trim whitespace
    NODE_ENV: process.env.NODE_ENV!,
    DB_URL: process.env.DB_URL!,
    ARGON2_MEMORY: argonMemory,
    ARGON2_TIME: argonTime,
    ARGON2_PARALLELISM: argonParallelism,
    RESEND_API_KEY: process.env.RESEND_API_KEY!,
    EMAIL_FROM: process.env.EMAIL_FROM!,
    EMAIL_VERIFICATION_EXPIRES_IN: process.env.EMAIL_VERIFICATION_EXPIRES_IN!,
    PASSWORD_RESET_EXPIRES_IN: process.env.PASSWORD_RESET_EXPIRES_IN!,
    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
    },
    GEMINI: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
      GEMINI_MODEL: process.env.GEMINI_MODEL!,
    },
  };
};

// Ensures configuration cannot be modified at runtime
export const config = Object.freeze(loadEnvVariables());
