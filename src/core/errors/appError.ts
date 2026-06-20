import { MESSAGES, ErrorCode } from "../messages/messages";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isAppError = true;

  constructor(code: ErrorCode) {
    const errorConfig = MESSAGES.ERROR[code];
    super(errorConfig?.message || "Erro desconhecido na aplicação.");
    
    this.name = "AppError";
    this.statusCode = errorConfig?.status || 500;
    this.code = code; 

    Object.setPrototypeOf(this, AppError.prototype);
  }
}