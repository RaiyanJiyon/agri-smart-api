import { envVars } from "../config/env.js";

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
    private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
        const timestamp = new Date().toISOString();
        const metaString = meta ? JSON.stringify(meta) : "";
        return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaString}`;
    }

    public info(message: string, meta?: unknown): void {
        // We will later swap this out for Winston/Pino transport
        console.log(this.formatMessage("info", message, meta));
    }

    public warn(message: string, meta?: unknown): void {
        console.warn(this.formatMessage("warn", message, meta));
    }

    public error(message: string, meta?: unknown): void {
        console.error(this.formatMessage("error", message, meta));
    }

    public debug(message: string, meta?: unknown): void {
        // Optional: only show debug logs if NODE_ENV is development
        if (envVars.NODE_ENV === "development") {
            console.debug(this.formatMessage("debug", message, meta));
        }
    }
}

export const logger = new Logger();