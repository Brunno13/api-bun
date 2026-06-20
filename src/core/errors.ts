export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500, public errorCode?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Requisição inválida") {
    super(message, 400, "BAD_REQUEST");
  }
}
