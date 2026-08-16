interface envConfig {
  PORT: number;
  NODE_ENV: string;
  DB_URL: string;
  CLIENT_URL: string[];

  SECURITY: {
    ARGON2_MEMORY: number;
    ARGON2_TIME: number;
    ARGON2_PARALLELISM: number;
  };

  MAIL: {
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
    EMAIL_VERIFICATION_EXPIRES_IN: string;
    PASSWORD_RESET_EXPIRES_IN: string;
  };

  JWT: {
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
  };

  AI: {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;

    MISTRAL_API_KEY: string;
    MISTRAL_MODEL: string;
  };

  STORAGE: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };

  REDIS: {
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string | undefined;
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
    'MISTRAL_API_KEY',
    'MISTRAL_MODEL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'REDIS_HOST',
    'REDIS_PORT',
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

  // Validate JWT expiration formats (e.g., 15m, 1h, 1d)
  const jwtExpiryRegex = /^\d+[smhd]$/;

  if (!jwtExpiryRegex.test(process.env.JWT_ACCESS_EXPIRES_IN!)) {
    throw new Error('JWT_ACCESS_EXPIRES_IN must be a valid time format (e.g., 15m, 1h, 1d)');
  }

  if (!jwtExpiryRegex.test(process.env.JWT_REFRESH_EXPIRES_IN!)) {
    throw new Error('JWT_REFRESH_EXPIRES_IN must be a valid time format (e.g., 7d, 30d)');
  }

  return {
    PORT: Number(process.env.PORT!),
    NODE_ENV: process.env.NODE_ENV!,
    DB_URL: process.env.DB_URL!,
    CLIENT_URL: process.env.CLIENT_URL!.split(',').map((url) => url.trim()), // Split by comma and trim whitespace

    SECURITY: {
      ARGON2_MEMORY: argonMemory,
      ARGON2_TIME: argonTime,
      ARGON2_PARALLELISM: argonParallelism,
    },

    MAIL: {
      RESEND_API_KEY: process.env.RESEND_API_KEY!,
      EMAIL_FROM: process.env.EMAIL_FROM!,
      EMAIL_VERIFICATION_EXPIRES_IN: process.env.EMAIL_VERIFICATION_EXPIRES_IN!,
      PASSWORD_RESET_EXPIRES_IN: process.env.PASSWORD_RESET_EXPIRES_IN!,
    },

    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
    },

    AI: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
      GEMINI_MODEL: process.env.GEMINI_MODEL!,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY!,
      MISTRAL_MODEL: process.env.MISTRAL_MODEL!,
    },

    STORAGE: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    },

    REDIS: {
      REDIS_HOST: process.env.REDIS_HOST!,
      REDIS_PORT: Number(process.env.REDIS_PORT!),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? undefined,
    },
  };
};

// Ensures configuration cannot be modified at runtime
export const config = Object.freeze(loadEnvVariables());
