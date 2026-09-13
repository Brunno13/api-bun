import { Elysia } from "elysia";
import { auth } from "../infrastructure/auth/auth";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { z } from "zod";
import { openapi } from "@elysia/openapi";
import { AwilixContainer } from "awilix";
import { AppError } from "../core/errors/appError"; 
import { MESSAGES, ErrorCode, HttpStatus, AppEnv, FrameworkErrorCode } from "../core/messages/messages";
import { userRoutes } from "./routes/user.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { logger } from "../core/utils/logger";

const exporterUrl =
  process.env.OTEL_EXPORTER_URL || "http://localhost:4318/v1/traces";
const traceExporter = new OTLPTraceExporter({
  url: exporterUrl,
});

type ElysiaOpenApiOptions = NonNullable<
  Parameters<typeof openapi>[0]
>;

type ElysiaDocumentation = NonNullable<
  ElysiaOpenApiOptions["documentation"]
>;

type ElysiaComponents = NonNullable<
  ElysiaDocumentation["components"]
>;

type ElysiaPaths = NonNullable<
  ElysiaDocumentation["paths"]
>;

type AppErrorLike = {
  isAppError?: boolean;
  name?: string;
  statusCode?: number;
  code?: string;
  message: string;
};

const isAppErrorLike = (value: unknown): value is AppErrorLike => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.message === "string" &&
    (
      candidate.isAppError === true ||
      candidate.name === "AppError"
    ) &&
    (
      candidate.statusCode === undefined ||
      typeof candidate.statusCode === "number"
    ) &&
    (
      candidate.code === undefined ||
      typeof candidate.code === "string"
    )
  );
};

export const createApp = async (di: AwilixContainer) => {
  const authPaths: Record<string, unknown> = {};
  let authComponents: unknown = {};

  try {
    const authSchema = await auth.api.generateOpenAPISchema();
    if (authSchema) {
      authComponents = authSchema.components ?? {};
      if (authSchema.paths) {
        for (const [path, config] of Object.entries(authSchema.paths)) {
          authPaths[`/api/auth${path}`] = config;
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== AppEnv.TEST) {
      logger.warn(
        { err: error },
        MESSAGES.SYSTEM.OPENAPI_GENERATION_FAILED,
      );
    }
  }

  return new Elysia()
    .use(
      openapi({
        mapJsonSchema: { zod: z.toJSONSchema },
        documentation: {
          info: {
            title: MESSAGES.OPENAPI.TITLE,
            version: MESSAGES.OPENAPI.VERSION,
            description: MESSAGES.OPENAPI.DESCRIPTION,
          },
          components: authComponents as ElysiaComponents,
          paths: authPaths as unknown as ElysiaPaths,
        },
      }),
    )
    .use(
      opentelemetry({
        spanProcessors: [new BatchSpanProcessor(traceExporter)],
      }),
    )
    .all(
      "/api/auth/*",
      async ({ request }) => auth.handler(request),
      { detail: { hide: true } }
    )
    .get("/", () => MESSAGES.SYSTEM.API_ONLINE)
    .get("/favicon.ico", () => new Response(null, { status: 204 }))
    .onError(({ code, error, set, request }) => {
      const caughtError: unknown = error;
      if (code === FrameworkErrorCode.NOT_FOUND || code === HttpStatus.NOT_FOUND) {
        set.status = HttpStatus.NOT_FOUND;
        return {
          success: false,
          code: FrameworkErrorCode.NOT_FOUND,
          message: MESSAGES.ERROR[ErrorCode.ROUTE_NOT_FOUND].message
        };
      }

      if (caughtError instanceof AppError || isAppErrorLike(caughtError)) {
        set.status = caughtError.statusCode ?? HttpStatus.BAD_REQUEST;

        return {
          success: false,
          code: caughtError.code ?? ErrorCode.UNKNOWN_APP_ERROR,
          message: caughtError.message,
        };
      }

      if (code === FrameworkErrorCode.VALIDATION) {
        set.status = HttpStatus.UNPROCESSABLE_ENTITY;
        return {
          success: false,
          code: ErrorCode.INVALID_DATA,
          message: MESSAGES.ERROR[ErrorCode.INVALID_DATA].message,
          details: error instanceof Error 
            ? error.message 
            : MESSAGES.SYSTEM.VALIDATION_FALLBACK_DETAIL, 
        };
      }

      logger.error({ 
        err: error, 
        route: request.url,
        method: request.method
      }, MESSAGES.SYSTEM.FATAL_ERROR_LOG);
      
      set.status = HttpStatus.INTERNAL_SERVER_ERROR;
      return {
        success: false,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: MESSAGES.ERROR[ErrorCode.INTERNAL_SERVER_ERROR].message,
      };
    })

    .use(userRoutes(di))
    .use(uploadRoutes(di));
};