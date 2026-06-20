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
import { logger } from "../core/utils/logger";

const exporterUrl =
  process.env.OTEL_EXPORTER_URL || "http://localhost:4318/v1/traces";
const traceExporter = new OTLPTraceExporter({
  url: exporterUrl,
});

export const createApp = async (di: AwilixContainer) => {
  let authPaths: any = {};
  let authComponents: any = {};

  try {
    const authSchema = await auth.api.generateOpenAPISchema();
    if (authSchema) {
      authComponents = authSchema.components || {};
      if (authSchema.paths) {
        for (const [path, config] of Object.entries(authSchema.paths)) {
          authPaths[`/api/auth${path}`] = config;
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== AppEnv.TEST) {
      logger.warn({ err: error }, MESSAGES.SYSTEM.OPENAPI_GENERATION_FAILED);
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
          components: authComponents as any,
          paths: authPaths,
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
    .onError(({ code, error, set, request }) => {
      const err = error as any;

      if (error instanceof AppError || err?.isAppError || err?.name === "AppError") {
        set.status = err.statusCode || HttpStatus.BAD_REQUEST;
        return {
          success: false,
          code: err.code || "UNKNOWN_APP_ERROR",
          message: err.message,
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

    .use(userRoutes(di));
};