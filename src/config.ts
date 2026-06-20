import { z } from "zod";
import { join } from "path";

const isTest = process.env.NODE_ENV === "test";

const defaultDatabaseUrl = isTest
  ? join(process.cwd(), "data", "test.sqlite")
  : "sqlite.db";

const envSchema = z.object({
  DATABASE_URL: z.string().default(defaultDatabaseUrl),
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const config = _env.data;
