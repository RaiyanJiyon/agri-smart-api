interface envConfig {
  PORT: number;
  CLIENT_URL: string;
  DB_URL: string;
  NODE_ENV: string;
  ARGON2_MEMORY: number;
  ARGON2_TIME: number;
  ARGON2_PARALLELISM: number

}

const loadEnvVariables = (): envConfig => {
  const requiredEnvVariables: string[] = ["PORT", "CLIENT_URL", "DB_URL", "NODE_ENV", "ARGON2_MEMORY", "ARGON2_TIME", "ARGON2_PARALLELISM"
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
    ARGON2_MEMORY: Number(process.env.ARGON2_MEMORY),
    ARGON2_TIME: Number(process.env.ARGON2_TIME),
    ARGON2_PARALLELISM: Number(process.env.ARGON2_PARALLELISM),
  };
};

// Ensures configuration cannot be modified at runtime
export const config = Object.freeze(loadEnvVariables());
