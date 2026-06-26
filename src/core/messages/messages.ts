export enum AppEnv {
  TEST = "test",
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

export enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

export enum FrameworkErrorCode {
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  PARSE = "PARSE",
  UNKNOWN = "UNKNOWN",
  BAD_REQUEST = "BAD_REQUEST",
}

export enum ErrorCode {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  DELETE_FAILED = "DELETE_FAILED",
  INVALID_DATA = "INVALID_DATA",
  UPLOAD_FAILED = "UPLOAD_FAILED",
}

export enum UserRole {
  ADMIN = "admin",   // Cria, edita, deleta e lista
  EDITOR = "editor", // Lista e edita, não cria nem deleta
  VIEWER = "viewer", // Apenas lista
}

export const MESSAGES = {
  SUCCESS: {
    USER_CREATED: "Usuário adicionado com sucesso.",
    USER_UPDATED: "Dados do usuário atualizados com sucesso.",
    USER_DELETED: "Usuário deletado com sucesso.",
    OK: "Operação realizada com sucesso.",
    AVATAR_UPLOADED: "Avatar atualizado com sucesso.",
  },
  
  ERROR: {
    [ErrorCode.INTERNAL_SERVER_ERROR]: { message: "Ocorreu um erro interno no servidor.", status: HttpStatus.INTERNAL_SERVER_ERROR },
    [ErrorCode.UNAUTHORIZED]: { message: "Não autorizado. Faça login primeiro.", status: HttpStatus.UNAUTHORIZED },
    [ErrorCode.FORBIDDEN]: { message: "Acesso negado. Seu papel não tem permissão para executar esta ação.", status: HttpStatus.FORBIDDEN },
    [ErrorCode.USER_NOT_FOUND]: { message: "Usuário não encontrado.", status: HttpStatus.NOT_FOUND },
    [ErrorCode.DELETE_FAILED]: { message: "Erro ao deletar o usuário. Verifique os dados e tente novamente.", status: HttpStatus.BAD_REQUEST },
    [ErrorCode.INVALID_DATA]: { message: "Os dados fornecidos são inválidos.", status: HttpStatus.UNPROCESSABLE_ENTITY },
    [ErrorCode.UPLOAD_FAILED]: { message: "Falha ao processar o upload do arquivo. Tente novamente mais tarde.", status: HttpStatus.INTERNAL_SERVER_ERROR },
  },

  SYSTEM: {
    VALIDATION_FALLBACK_DETAIL: "Erro na validação dos campos.",
    API_ONLINE: "A API Elysia + Drizzle está online!",
    FATAL_ERROR_LOG: "🔥 ERRO FATAL:",
    OPENAPI_GENERATION_FAILED: "⚠️ AVISO: Falha ao gerar o esquema OpenAPI do Better Auth.",
    UNKNOWN_ERROR: "Erro desconhecido na aplicação.",
  },

  DOCS: {
    TAGS: {
      USERS: "Usuários",
      UPLOAD: "Uploads",
    },
    USERS: {
      CREATE: "Adiciona usuário",
      LIST: "Lista todos os usuários",
      UPDATE: "Altera a idade do usuário",
      DELETE: "Deleta usuário",
    },
    UPLOAD: {
      AVATAR: "Realiza o upload da foto de perfil do usuário (Máx: 5MB, JPG/PNG/WEBP)",
    },
  },

  OPENAPI: {
    TITLE: "API Bun - Clean Architecture",
    VERSION: "1.0.0",
    DESCRIPTION: "Documentação interativa. Autentique-se pelo endpoint de Login para acessar rotas protegidas (cookies automáticos).",
  }
} as const;