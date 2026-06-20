import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // A Mágica do Desacoplamento acontece aqui:
  user: {
    additionalFields: {
      age: {
        type: "number",
        required: true,
        defaultValue: 18, // Opcional
      },
    },
  },
});
