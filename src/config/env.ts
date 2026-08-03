import ms from 'ms';
interface envConfig {
  PORT: number;
  CLIENT_URL: string;
  DB_URL: string;
  NODE_ENV: string;
  ARGON2_MEMORY: number;
  ARGON2_TIME: number;
  ARGON2_PARALLELISM: number;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  TOKEN_SIZE: number;
  HASH_ALGORITHM: string;

  JWT: {
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: number;
  };
}

const parseExpiresIn = (value: string): number => {
  const msFn = ms as unknown as (value: string) => number;
  const result = msFn(value);

  if (typeof result !== 'number' || Number.isNaN(result)) {
    throw new Error('Invalid expiration environment value');
  }
  return result;
};

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
    'TOKEN_SIZE',
    'HASH_ALGORITHM',
    'JWT_ACCESS_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
  });

  return {
    PORT: Number(process.env.PORT!),
    CLIENT_URL: process.env.CLIENT_URL!,
    NODE_ENV: process.env.NODE_ENV!,
    DB_URL: process.env.DB_URL!, // Force TS to accept it because your loop validates it
    ARGON2_MEMORY: Number(process.env.ARGON2_MEMORY!),
    ARGON2_TIME: Number(process.env.ARGON2_TIME!),
    ARGON2_PARALLELISM: Number(process.env.ARGON2_PARALLELISM!),
    RESEND_API_KEY: process.env.RESEND_API_KEY!,
    EMAIL_FROM: process.env.EMAIL_FROM!,
    TOKEN_SIZE: Number(process.env.TOKEN_SIZE!),
    HASH_ALGORITHM: process.env.HASH_ALGORITHM!,
    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
      JWT_REFRESH_EXPIRES_IN: parseExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN!),
    },
  };
};

// Ensures configuration cannot be modified at runtime
export const config = Object.freeze(loadEnvVariables());
