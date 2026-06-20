 import { MESSAGES, ErrorCode, HttpStatus } from "../messages/messages";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isAppError = true;

  constructor(code: ErrorCode) {
    const errorConfig = MESSAGES.ERROR[code];
    super(errorConfig?.message || "Erro desconhecido na aplicação.");
    
    this.name = "AppError";
    this.statusCode = errorConfig?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    this.code = code; 

    Object.setPrototypeOf(this, AppError.prototype);
  }
}