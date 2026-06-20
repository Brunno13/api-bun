import { Elysia } from "elysia";
import { z } from "zod";
import { AwilixContainer } from "awilix";
import { UserManager } from "../../core/usecases/userManager";
import { auth } from "../../infrastructure/auth/auth";

export const userRoutes = (di: AwilixContainer) => {
  const userManager = di.resolve<UserManager>("userManager");

  return new Elysia({ prefix: "/users" })
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
      },
    )
    .get("/", async ({ request, set }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (!session) {
        set.status = 401;
        return { error: "Não autorizado. Faça login primeiro." };
      }
      return await userManager.findAll();
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
      },
    )
    .delete(
      "/:email",
      async ({ params }) => {
        const success = await userManager.deleteByEmail(params.email);
        return {
          success: success,
          message: success
            ? "Usuário deletado com sucesso!"
            : "Erro ao deletar.",
        };
      },
      {
        params: z.object({ email: z.string().email() }),
      },
    );
};
