import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import * as schema from "../db/schema";
import { UserRole } from "../../core/messages/messages";
import { logger } from "../../core/utils/logger";
import { config } from "../../config";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000"],

  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      age: {
        type: "number",
        required: true,
        defaultValue: 18,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.VIEWER,
      }
    },
  },
  plugins: [
    openAPI()
  ]
});

export const seedAdmin = async () => {
  const email = config.BOOTSTRAP_ADMIN_EMAIL;
  const password = config.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.info( "Bootstrap do administrador não configurado; seed ignorado." );
    return;
  }

  try {
    const existingAdmin = await db.select().from(schema.user).where(eq(schema.user.email, email));

    if (existingAdmin.length > 0) {
      logger.info( { email }, "Administrador de bootstrap já existe; seed ignorado." );
      return;
    }

    logger.info( { email }, "🌱 Criando administrador inicial..." );

    const response = await auth.api.signUpEmail({
      body: {
        name: "Administrador do Sistema",
        email,
        password,
        age: 99,
        role: UserRole.ADMIN,
      },
    });

    if (response?.user) {
      logger.info( { email }, "✅ Administrador inicial criado." );
      return;
    }

    logger.error( { email }, "❌ O Better Auth não conseguiu criar o administrador inicial." );
  } catch (error) {
    logger.error( { err: error, email }, "❌ Erro ao criar o administrador inicial." );
  }
};