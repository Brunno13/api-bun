// src/presentation/routes/user.routes.ts
import { Elysia } from "elysia";
import { z } from "zod";
import { AwilixContainer } from "awilix";
import { UserManager } from "../../core/usecases/userManager";
import { auth } from "../../infrastructure/auth/auth";
import { AppError } from "../../core/errors/appError";
import { MESSAGES, ErrorCode } from "../../core/messages/messages";

export const userRoutes = (di: AwilixContainer) => {
  const userManager = di.resolve<UserManager>("userManager");

  return new Elysia({ prefix: "/users" })
    .guard({
      async beforeHandle({ request }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          throw new AppError(ErrorCode.UNAUTHORIZED);
        }
      },
    })
    .post(
      "/",
      async ({ body }) => {
        return userManager.create(body);
      },
      {
        body: z.object({
          name: z.string().trim().min(1),
          age: z.number().int().positive(),
          email: z.string().email(),
        }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.USERS],
          summary: MESSAGES.DOCS.USERS.CREATE,
        },
      },
    )
    .get("/", async () => {
      return await userManager.findAll();
    }, {
      detail: {
        tags: [MESSAGES.DOCS.TAGS.USERS],
        summary: MESSAGES.DOCS.USERS.LIST,
      }
    })
    .put(
      "/:email",
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
        detail: {
          tags: [MESSAGES.DOCS.TAGS.USERS],
          summary: MESSAGES.DOCS.USERS.UPDATE,
        },
      },
    )
    .delete(
      "/:email",
      async ({ params }) => {
        const success = await userManager.deleteByEmail(params.email);
        
        if (!success) {
          throw new AppError(ErrorCode.DELETE_FAILED);
        }

        return {
          success: true,
          message: MESSAGES.SUCCESS.USER_DELETED,
        };
      },
      {
        params: z.object({ email: z.string().email() }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.USERS],
          summary: MESSAGES.DOCS.USERS.DELETE,
        },
      },
    );
};