import { MESSAGES, ErrorCode } from "../messages/messages";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(code: ErrorCode) {
    const errorConfig = MESSAGES.ERROR[code];
    super(errorConfig.message);
    
    this.statusCode = errorConfig.status;
    this.code = code; 

    Object.setPrototypeOf(this, AppError.prototype);
  }
}