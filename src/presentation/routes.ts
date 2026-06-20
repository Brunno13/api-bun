import { Elysia } from "elysia";
import { auth } from "../infrastructure/auth/auth";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { z } from "zod";
import { openapi } from "@elysia/openapi";
import { AwilixContainer } from "awilix";
import { AppError } from "../core/errors";

import { userRoutes } from "./routes/user.routes";

const exporterUrl =
  process.env.OTEL_EXPORTER_URL || "http://localhost:4318/v1/traces";
const traceExporter = new OTLPTraceExporter({
  url: exporterUrl,
});

export const createApp = async (di: AwilixContainer) => {
  
  const authSchema = await auth.api.generateOpenAPISchema();

  const authPaths: any = {};
  if (authSchema && authSchema.paths) {
    for (const [path, config] of Object.entries(authSchema.paths)) {
      authPaths[`/api/auth${path}`] = config;
    }
  }

  return new Elysia()
    .use(
      openapi({
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
        documentation: {
          info: {
            title: "API Bun - Clean Architecture",
            version: "1.0.0",
            description: "Documentação interativa. Para rotas protegidas, faça o login e clique no botão 'Authorize'.",
          },
          components: authSchema?.components as any,
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
      async ({ request }) => {
        return auth.handler(request);
      }, 
      {
        detail: {
          hide: true,
        }
      }
    )
    .get("/", () => "A API Elysia + Drizzle está online!")
    .use(userRoutes(di))
    .onError(({ error, set }) => {
      if (error instanceof AppError) {
        set.status = error.statusCode;
        return {
          success: false,
          message: error.message,
          code: error.errorCode,
        };
      }
      set.status = 500;
      return {
        success: false,
        message: "Erro interno ao processar solicitação.",
        code: "INTERNAL_SERVER_ERROR",
      };
    });
};