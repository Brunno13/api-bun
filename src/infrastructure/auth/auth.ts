import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import * as schema from "../db/schema";
import { UserRole } from "../../core/messages/messages";

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
  try {
    const existingAdmin = await db.select().from(schema.user).where(eq(schema.user.email, "admin@admin.com"));
    
    if (existingAdmin.length === 0) {
      console.log("🌱 Semeando usuário administrador padrão...");
      
      const response = await auth.api.signUpEmail({
        body: {
          name: "Administrador do Sistema",
          email: "admin@admin.com",
          password: "admin1234",
          age: 99,
          role: UserRole.ADMIN 
        }
      });
      
      if (response && response.user) {
        console.log("✅ Admin criado! (E-mail: admin@admin.com | Senha: admin1234)");
      } else {
        console.error("❌ O Better Auth não conseguiu criar o usuário. Resposta:", response);
      }
    }
  } catch (error) {
    console.error("❌ Erro fatal ao criar o administrador padrão:", error);
  }
};