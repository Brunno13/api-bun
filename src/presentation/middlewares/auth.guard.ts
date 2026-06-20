import { Elysia } from "elysia";
import { auth } from "../../infrastructure/auth/auth";

export const authGuard = (app: Elysia) =>
  app
    .derive(async ({ request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw new Error("UNAUTHORIZED");
      }

      return { user: session.user };
    })
    .onError(({ error, set }) => {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        set.status = 401;
        return { success: false, message: "Não autorizado" };
      }
      
      return { success: false, message: "Erro interno" };
    });