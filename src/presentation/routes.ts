import { Elysia } from "elysia";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { z } from "zod";
import { openapi } from "@elysia/openapi";
import { container } from "../container";
import { UserManager } from "../core/usecases/userManager";
import { AppError } from "../core/errors";

const traceExporter = new OTLPTraceExporter({
  url: "http://jaeger:4318/v1/traces", 
});

export const createApp = (userManager: UserManager) => {
  return new Elysia()
    .use(
      openapi({
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
      }),
    )
    .use(
      opentelemetry({
        spanProcessors: [new BatchSpanProcessor(traceExporter)],
      })
    )
    .get("/", () => "A API Elysia + Drizzle está online!")
    .post(
      "/users",
      async ({ body }) => {
        return userManager.create(body);
      },
      {
        body: z.object({
          name: z.string().trim().min(1),
          age: z.number().int().positive(),
          email: z.string().email(),
        }),
      }
    )
    .get("/users", async () => {
      return await userManager.findAll();
    })
    .put(
      "/users/:email",
      async ({ params, body }) => {
        return userManager.updateByEmail(params.email, body);
      },
      {
        params: z.object({
          email: z.string().email(),
        }),
        body: z.object({
          age: z.number().int().positive(),
        }),
      }
    )
    .delete(
      "/users/:email",
      async ({ params }) => {
        const success = await userManager.deleteByEmail(params.email);
        return {
          success: success,
          message: success ? "Usuário deletado com sucesso!" : "Erro ao deletar.",
        };
      },
      {
        params: z.object({ email: z.string().email() }),
      },
    )
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

export const app = createApp(container.userDomain.userManager);
