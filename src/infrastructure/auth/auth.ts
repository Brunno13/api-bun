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
        input: false,
      }
    },
  },
  plugins: [
    openAPI()
  ]
});

type SignUpEmailInput = Parameters<typeof auth.api.signUpEmail>[0];

type AdminBootstrapSignUpResult = {
  user?: { id: string } | null;
} | null;

type BootstrapUser = { id: string; role: string } | null;

export type AdminBootstrapDependencies = {
  findUserByEmail: (email: string) => Promise<BootstrapUser>;
  signUpEmail: (input: SignUpEmailInput) => Promise<AdminBootstrapSignUpResult>;
  promoteAdmin: (userId: string) => Promise<void>;
  findUserById: (userId: string) => Promise<BootstrapUser>;
};

export const runAdminBootstrap = async (
  email: string | undefined,
  password: string | undefined,
  dependencies: AdminBootstrapDependencies,
) => {
  if (!email || !password) {
    logger.info("Bootstrap do administrador não configurado; seed ignorado.");
    return;
  }

  try {
    const existing = await dependencies.findUserByEmail(email);
    if (existing) {
      if (existing.role !== String(UserRole.ADMIN)) {
        // Do not elevate a preexisting account: it may have been registered by someone else.
        logger.error(
          { email },
          "Conta de bootstrap existente sem papel admin; intervenção manual necessária.",
        );
      } else {
        logger.info({ email }, "Administrador de bootstrap já existe; seed ignorado.");
      }
      return;
    }

    logger.info({ email }, "Criando administrador inicial...");
    // Public sign-up must never accept role=admin from HTTP input.
    const response = await dependencies.signUpEmail({
      body: {
        name: "Administrador do Sistema",
        email,
        password,
        age: 99,
      },
    });

    const userId = response?.user?.id;
    if (!userId) {
      logger.error({ email }, "Cadastro do administrador não retornou um ID; seed incompleto.");
      return;
    }

    // Only the internal server-side database operation may assign admin privileges.
    await dependencies.promoteAdmin(userId);
    const verifiedUser = await dependencies.findUserById(userId);
    if (verifiedUser?.role !== String(UserRole.ADMIN)) {
      logger.error(
        { email },
        "Promoção do administrador não confirmada no banco; seed incompleto.",
      );
      return;
    }

    logger.info({ email }, "Administrador inicial criado e papel admin verificado.");
  } catch (error) {
    logger.error({ err: error, email }, "Falha no bootstrap do administrador.");
  }
};

// Separate the database adapter so integration tests exercise its real SQL paths.
export const createAdminBootstrapDependencies = (
  database: typeof db,
  signUpEmail: AdminBootstrapDependencies["signUpEmail"],
): AdminBootstrapDependencies => ({
  findUserByEmail: async (email) => {
    const [existing] = await database
      .select({ id: schema.user.id, role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);
    return existing ?? null;
  },
  signUpEmail,
  promoteAdmin: async (userId) => {
    await database
      .update(schema.user)
      .set({ role: UserRole.ADMIN })
      .where(eq(schema.user.id, userId));
  },
  findUserById: async (userId) => {
    const [existing] = await database
      .select({ id: schema.user.id, role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    return existing ?? null;
  },
});

// Allow a deterministic no-credentials test without reading or writing a database.
export const seedAdmin = async (
  credentials: Pick<
    typeof config,
    "BOOTSTRAP_ADMIN_EMAIL" | "BOOTSTRAP_ADMIN_PASSWORD"
  > = config,
) => {
  await runAdminBootstrap(
    credentials.BOOTSTRAP_ADMIN_EMAIL,
    credentials.BOOTSTRAP_ADMIN_PASSWORD,
    createAdminBootstrapDependencies(db, (input) => auth.api.signUpEmail(input)),
  );
};
