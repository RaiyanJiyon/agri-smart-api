interface envConfig {
    PORT: number,
    CLIENT_URL: string
    NODE_ENV: string
}

const loadEnvVariables = (): envConfig => {
    const requiredEnvVariables: string[] = [
        "PORT", "CLIENT_URL", "NODE_ENV"
    ];

    requiredEnvVariables.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Environment variable ${key} is not set.`);
        }
    });

    return {
        PORT: Number(process.env.PORT ?? 5000),
        CLIENT_URL: (process.env.CLIENT_URL ?? ""),
        NODE_ENV: (process.env.NODE_ENV ?? "development"),
    };
};

export const envVars = loadEnvVariables();