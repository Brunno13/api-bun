import { Elysia } from "elysia";
import { auth } from "../../infrastructure/auth/auth";
import { AppError } from "../../core/errors/appError";
import { ErrorCode } from "../../core/messages/messages";

export const authGuard = (app: Elysia) =>
  app.derive(async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AppError(ErrorCode.UNAUTHORIZED);
    }

    return { user: session.user };
  });