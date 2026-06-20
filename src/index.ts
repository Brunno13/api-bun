import { Elysia } from "elysia";
import { z } from "zod";
import { openapi } from "@elysia/openapi";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq } from "drizzle-orm";
import { Database } from "bun:sqlite";
import { users } from "./db/schema";

// 1. Usando a conexão ultra-rápida nativa do Bun (aproveitando o seu .env)
const sqlite = new Database(process.env.DATABASE_URL || "sqlite.db");
const db = drizzle(sqlite);

const app = new Elysia()
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema, // Garante que o Swagger entenda as regras do Zod
      },
    }),
  )
  .get("/", () => "A API Elysia + Drizzle está online!")

  // ==========================================
  // ROTAS DE USUÁRIOS (CRUD REAL)
  // ==========================================

  // CREATE: Cria um novo usuário
  .post(
    "/users",
    async ({ body }) => {
      // O .returning() faz o banco devolver o dado gerado (incluindo o ID automático)
      const newUser = await db.insert(users).values(body).returning();
      return newUser[0];
    },
    {
      // O Zod blinda a sua rota. Se enviarem um dado errado, o Elysia recusa antes de bater no banco.
      body: z.object({
        name: z.string().trim().min(1),
        age: z.number().int().positive(),
        email: z.string().email(),
      }),
    },
  )

  // READ: Lista todos os usuários
  .get("/users", async () => {
    const allUsers = await db.select().from(users);
    return allUsers; // Retorna um array JSON lindíssimo
  })

  // UPDATE: Atualiza a idade do usuário pelo email
  .put(
    "/users/:email",
    async ({ params, body }) => {
      const updatedUser = await db
        .update(users)
        .set({ age: body.age })
        .where(eq(users.email, params.email))
        .returning();

      return updatedUser.length > 0
        ? updatedUser[0]
        : { error: "Usuário não encontrado" };
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

  // DELETE: Remove um usuário pelo email
  .delete(
    "/users/:email",
    async ({ params }) => {
      await db.delete(users).where(eq(users.email, params.email));
      return { success: true, message: "Usuário deletado do banco!" };
    },
    {
      params: z.object({
        email: z.string().email(),
      }),
    },
  )

  .listen(3000);

console.log(
  `🦊 Elysia está rodando em http://${app.server?.hostname}:${app.server?.port}`,
);
