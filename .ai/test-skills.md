<output_constraints>

OUTPUT ONLY VALID, RUNNABLE TYPESCRIPT CODE.

ENCLOSE CODE in a single ```typescript block. ZERO explanations outside the block.

ASSUME COLOCATION: Test files are in the EXACT SAME folder as source files. Use ./filename to import.

TYPESCRIPT FIX: Use as any aggressively when passing mock data or container dependencies to satisfy strict types.

COMPLETE FILE: Do not truncate the code.
</output_constraints>

<framework_rules>

RUNNER: ONLY import from bun:test. ALWAYS ensure describe, it, expect, mock, spyOn, beforeEach, afterEach are imported if used.

EXPECT FAIL: When testing errors, ALWAYS use expect.fail("Should have thrown") inside the try block.
</framework_rules>

<layer_strategies>

[USE_CASES_UNIT_TESTS]

Goal: Isolate pure business logic. Mock all injected dependencies.

Example Pattern:

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { AppError } from "../errors/appError";
import { HttpStatus } from "../messages/messages";
// import the manager...

describe("Manager Unit Tests", () => {
  let manager: any;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { 
      findById: mock().mockResolvedValue({ id: '1' }),
      create: mock().mockResolvedValue({ id: '1' }) 
    };
    // manager = new Manager({ repo: mockRepo });
  });

  it("should throw AppError when not found", async () => {
    mockRepo.findById.mockResolvedValue(null);
    try {
      // await manager.getById("999");
      expect.fail("Should have thrown an AppError");
    } catch (error: any) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    }
  });
});


[REPOSITORIES_INTEGRATION_TESTS]

Goal: SQLite In-Memory Integration.

Imports: import { Database } from "bun:sqlite"; import { drizzle, BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

Setup Pattern:

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle, BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
// import repo...

describe("Repository Integration Tests", () => {
  let testDb: Database;
  let testDbInstance: BunSQLiteDatabase;
  let repository: any;

  beforeEach(async () => {
    testDb = new Database(":memory:");
    testDbInstance = drizzle(testDb);
    // Ensure you create all necessary fields in the table
    testDb.exec(`CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, age INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'VIEWER', emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);`);
    // repository = new DrizzleUserRepository({ db: testDbInstance });
  });

  afterEach(() => testDb.close());

  it("should create", async () => {
    // const result = await repository.create({ name: "A", email: "a@a.com", age: 20 } as any);
    // expect(result).not.toBeNull();
  });
});


[PRESENTATION_AND_ROUTES_TESTS]

Goal: Test Elysia API endpoints using Awilix and In-Memory DB.

Auth Mocking: You MUST mock auth.api.getSession using spyOn to simulate RBAC roles for protected routes.

Setup Pattern (For Global App Routes like routes.ts):

import { describe, it, expect, beforeEach } from "bun:test";
import { createContainer, asValue } from "awilix";
import { createApp } from "./routes";

const BASE_URL = "http://localhost";

describe("Presentation Layer - Global API Routes", () => {
  let testApp: any;

  beforeEach(async () => {
    const mockContainer = createContainer();
    mockContainer.register({
      userManager: asValue({}), // Mock dependencies
    });
    testApp = await createApp(mockContainer as any);
  });

  it("GET / should return 200", async () => {
    const response = await testApp.handle(new Request(`${BASE_URL}/`));
    expect(response.status).toBe(200);
  });
});


Setup Pattern (For Specific Routes with RBAC):

import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { createContainer, asValue } from "awilix";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { auth } from "../../infrastructure/auth/auth";
import { UserRole, HttpStatus } from "../../core/messages/messages";
import { createApp } from "../routes";

const BASE_URL = "http://localhost";

describe("Presentation Layer - User Routes (RBAC)", () => {
  let testApp: any;
  let testDb: Database;

  const mockSessionWithRole = (role: UserRole) => {
    spyOn(auth.api, "getSession").mockResolvedValue({
      session: { id: "123" },
      user: { role: role }
    } as any);
  };

  beforeEach(async () => {
    mockSessionWithRole(UserRole.ADMIN);

    testDb = new Database(":memory:");
    const testDbInstance = drizzle(testDb);
    testDb.exec(`CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, age INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'VIEWER', emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);`);

    const testContainer = createContainer();
    testContainer.register({ 
      userManager: asValue({ create: () => ({ id: "1" }) }) 
    });

    testApp = await createApp(testContainer as any);
  });

  afterEach(() => testDb.close());

  it("should return 403 FORBIDDEN when session is VIEWER", async () => {
    mockSessionWithRole(UserRole.VIEWER);
    const res = await testApp.handle(new Request(`${BASE_URL}/users/`, { method: 'POST' }));
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });
});


</layer_strategies>