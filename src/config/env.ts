interface envConfig {
    PORT: number;
    CLIENT_URL: string;
    DB_URL: string;
    NODE_ENV: string;
}

const loadEnvVariables = (): envConfig => {
    const requiredEnvVariables: string[] = [
        "PORT", "CLIENT_URL", "DB_URL", "NODE_ENV"
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
    };
};

export const envVars = loadEnvVariables();