import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    // Busca a variável do .env, e se por acaso falhar, cria um arquivo "sqlite.db" como plano B (Fallback)
    url: process.env.DATABASE_URL || "sqlite.db",
  },
});
