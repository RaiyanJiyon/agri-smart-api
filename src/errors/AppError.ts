export class ApiError extends Error {
  public readonly statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;

    this.name = 'ApiError';

    this.isOperational = true; //Marks it as a trusted, handled operational error

    Error.captureStackTrace(this, this.constructor);
  }
}
