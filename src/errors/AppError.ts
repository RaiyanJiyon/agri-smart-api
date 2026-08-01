export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; //Marks it as a trusted, handled operational error

    Error.captureStackTrace(this, this.constructor);
  }
}
