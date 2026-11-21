import { describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  createAdminBootstrapDependencies,
  runAdminBootstrap,
  seedAdmin,
  type AdminBootstrapDependencies,
} from "./auth";
import { UserRole } from "../../core/messages/messages";

type StubOptions = {
  existing?: { id: string; role: string } | null;
  signUpResult?: { user?: { id: string } | null } | null;
  signUpFails?: boolean;
  promotionFails?: boolean;
  persistedRole?: string | null;
};

const createDependencies = (options: StubOptions = {}) => {
  const dependencies = {
    findUserByEmail: mock(() => Promise.resolve(options.existing ?? null)),
    signUpEmail: mock(() => {
      if (options.signUpFails) return Promise.reject(new Error("simulated sign-up failure"));
      return Promise.resolve(
        Object.prototype.hasOwnProperty.call(options, "signUpResult")
          ? (options.signUpResult ?? null)
          : { user: { id: "bootstrap-admin-id" } },
      );
    }),
    promoteAdmin: mock(() => {
      if (options.promotionFails) return Promise.reject(new Error("simulated promotion failure"));
      return Promise.resolve();
    }),
    findUserById: mock(() => {
      if (options.persistedRole === null) return Promise.resolve(null);
      return Promise.resolve({
        id: "bootstrap-admin-id",
        role: options.persistedRole ?? UserRole.ADMIN,
      });
    }),
  } satisfies AdminBootstrapDependencies;
  return dependencies;
};

describe("Admin bootstrap", () => {
  it("seedAdmin safely skips initialization when credentials are missing", async () => {
    // Explicit blank credentials make this deterministic even if local env has bootstrap values.
    const result = await seedAdmin({
      BOOTSTRAP_ADMIN_EMAIL: "",
      BOOTSTRAP_ADMIN_PASSWORD: "",
    });
    expect(result).toBeUndefined();
  });

  it("skips bootstrap when credentials are absent", async () => {
    const deps = createDependencies();
    await runAdminBootstrap(undefined, undefined, deps);
    expect(deps.findUserByEmail).toHaveBeenCalledTimes(0);
    expect(deps.signUpEmail).toHaveBeenCalledTimes(0);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("does not duplicate an existing administrator", async () => {
    const deps = createDependencies({
      existing: { id: "existing-admin", role: UserRole.ADMIN },
    });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.findUserByEmail).toHaveBeenCalledWith("admin@example.com");
    expect(deps.signUpEmail).toHaveBeenCalledTimes(0);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("does not promote an existing non-admin account", async () => {
    const deps = createDependencies({
      existing: { id: "preexisting-user", role: UserRole.VIEWER },
    });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.signUpEmail).toHaveBeenCalledTimes(0);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("creates through Better Auth without accepting a role in sign-up", async () => {
    const deps = createDependencies();
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.signUpEmail).toHaveBeenCalledWith({
      body: {
        name: "Administrador do Sistema",
        email: "admin@example.com",
        password: "strong-password",
        age: 99,
      },
    });
    expect(deps.promoteAdmin).toHaveBeenCalledWith("bootstrap-admin-id");
    expect(deps.findUserById).toHaveBeenCalledWith("bootstrap-admin-id");
  });

  it("does not elevate anyone if sign-up fails", async () => {
    const deps = createDependencies({ signUpFails: true });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("does not elevate anyone if the sign-up response has no user", async () => {
    const deps = createDependencies({ signUpResult: {} });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("does not promote anyone when sign-up returns null", async () => {
    const deps = createDependencies({ signUpResult: null });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(0);
  });

  it("does not consider a missing database user as verified", async () => {
    const deps = createDependencies({ persistedRole: null });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(1);
    expect(deps.findUserById).toHaveBeenCalledTimes(1);
  });

  it("does not report an admin as verified when promotion fails", async () => {
    const deps = createDependencies({ promotionFails: true });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(1);
    expect(deps.findUserById).toHaveBeenCalledTimes(0);
  });

  it("checks the stored role after promotion", async () => {
    const deps = createDependencies({ persistedRole: UserRole.VIEWER });
    await runAdminBootstrap("admin@example.com", "strong-password", deps);
    expect(deps.findUserById).toHaveBeenCalledTimes(1);
    // A viewer is never considered a verified administrator.
    expect(deps.promoteAdmin).toHaveBeenCalledTimes(1);
  });
});

// Exercises the same Drizzle reads and writes used by the production bootstrap,
// without connecting to staging or touching the Better Auth production database.
const createBootstrapSqlite = () => {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE "user" (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL,
      image TEXT,
      age INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  return { sqlite, database: drizzle(sqlite) };
};

const insertBootstrapUser = (
  sqlite: Database,
  id: string,
  email: string,
  role: UserRole,
) => {
  const now = Math.floor(Date.now() / 1000);
  sqlite.query(`
    INSERT INTO "user"
      (id, name, email, emailVerified, age, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, "Administrador do Sistema", email, 0, 99, role, now, now);
};

describe("Admin bootstrap - Drizzle adapter integration", () => {
  it("creates and promotes the new account, then skips it on the next boot", async () => {
    const { sqlite, database } = createBootstrapSqlite();
    try {
      const signUpEmail = mock(() => {
        insertBootstrapUser(sqlite, "bootstrap-admin-id", "admin@example.com", UserRole.VIEWER);
        return Promise.resolve({ user: { id: "bootstrap-admin-id" } });
      });
      const dependencies = createAdminBootstrapDependencies(database, signUpEmail);

      await runAdminBootstrap("admin@example.com", "strong-password", dependencies);

      const created = sqlite.query('SELECT role FROM "user" WHERE id = ?')
        .get("bootstrap-admin-id") as { role: string } | null;
      expect(created?.role).toBe(UserRole.ADMIN);
      expect(signUpEmail).toHaveBeenCalledTimes(1);

      await runAdminBootstrap("admin@example.com", "strong-password", dependencies);
      expect(signUpEmail).toHaveBeenCalledTimes(1);
      const users = sqlite.query('SELECT COUNT(*) AS total FROM "user"')
        .get() as { total: number };
      expect(users.total).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("does not promote an account that existed before bootstrap", async () => {
    const { sqlite, database } = createBootstrapSqlite();
    try {
      insertBootstrapUser(sqlite, "existing-id", "admin@example.com", UserRole.VIEWER);
      const signUpEmail = mock(() =>
        Promise.reject(new Error("Should not sign up an existing user")),
      );
      const dependencies = createAdminBootstrapDependencies(database, signUpEmail);

      await runAdminBootstrap("admin@example.com", "strong-password", dependencies);

      const stored = sqlite.query('SELECT role FROM "user" WHERE id = ?')
        .get("existing-id") as { role: string } | null;
      expect(stored?.role).toBe(UserRole.VIEWER);
      expect(signUpEmail).toHaveBeenCalledTimes(0);
    } finally {
      sqlite.close();
    }
  });
});
