import { Elysia } from "elysia";
import { z } from "zod";
import { openapi } from "@elysia/openapi";
import { UserManager } from "../core/usecases/user_manager";
import { DrizzleUserRepository } from "../infrastructure/repositories/user_repository";

// Instância do Manager (Injeção de dependência para a camada de apresentação)
const userManager = new UserManager(new DrizzleUserRepository());

export const app = new Elysia()
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
    }),
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
    },
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
    },
  )
  .delete(
    "/users/:email",
    async ({ params }) => {
      const result = await userManager.deleteByEmail(params.email);
      return result;
    },
    {
      params: z.object({ email: z.string().email() }),
    },
  );
