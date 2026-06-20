import { Elysia } from "elysia";
import { z } from "zod";
import { AwilixContainer } from "awilix";
import { UserManager } from "../../core/usecases/userManager";
import { auth } from "../../infrastructure/auth/auth";
import { AppError } from "../../core/errors/appError";
import { MESSAGES, ErrorCode, UserRole } from "../../core/messages/messages";
import { requireRoles } from "../middlewares/role.validator";

export const userRoutes = (di: AwilixContainer) => {
  const userManager = di.resolve<UserManager>("userManager");

  return new Elysia({ prefix: "/users" })
    .derive(async ({ request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw new AppError(ErrorCode.UNAUTHORIZED);
      }

      return { user: session.user };
    })
    
    .post(
      "/",
      async ({ body }) => userManager.create(body),
      {
        beforeHandle: requireRoles(UserRole.ADMIN), 
        body: z.object({
          name: z.string().trim().min(1),
          age: z.number().int().positive(),
          email: z.string().email(),
          role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
        }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.USERS],
          summary: MESSAGES.DOCS.USERS.CREATE,
        },
      },
    )
    
    .get("/", async () => userManager.findAll(), {
      beforeHandle: requireRoles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER),
      detail: {
        tags: [MESSAGES.DOCS.TAGS.USERS],
        summary: MESSAGES.DOCS.USERS.LIST,
      }
    })
    
    .put(
      "/:email",
      async ({ params, body }) => userManager.updateByEmail(params.email, body),
      {
        beforeHandle: requireRoles(UserRole.ADMIN, UserRole.EDITOR),
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
        await userManager.deleteByEmail(params.email);
        
        return {
          success: true,
          message: MESSAGES.SUCCESS.USER_DELETED,
        };
      },
      {
        beforeHandle: requireRoles(UserRole.ADMIN),
        params: z.object({ email: z.string().email() }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.USERS],
          summary: MESSAGES.DOCS.USERS.DELETE,
        },
      },
    );
};