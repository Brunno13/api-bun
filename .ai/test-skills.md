<output_constraints>

OUTPUT ONLY VALID, RUNNABLE TYPESCRIPT CODE.

ENCLOSE CODE in a single ```typescript block. ZERO markdown text outside the code block.

ASSUME COLOCATION: Test files are in the EXACT SAME folder as source files. Use ./filename to import the target module.

TYPESCRIPT FIX: Use as any AGGRESSIVELY on mock objects and Awilix DI containers to bypass TS strict mode compilation errors.

COMPLETE FILE: Do not truncate. Always output the full, complete test file.
</output_constraints>

<framework_rules>

RUNNER: ONLY import from bun:test (describe, it, expect, mock, spyOn, beforeEach, afterEach). NO Jest/Vitest.

MOCKING: Use mock().mockResolvedValue(data) or mock().mockReturnValue(data).

GLOBAL LOGGERS: If testing files that import logger from src/core/utils/logger, always ignore its output or mock it to prevent console spam.

ENVIRONMENT: Always set process.env.NODE_ENV = "test"; at the very top of the test file.
</framework_rules>

<layer_strategies>
[USE_CASES]

Goal: Isolate pure business logic. Mock all injected Awilix dependencies.

Example:
const manager = new Manager({ repo: { findById: mock() } as any });

[REPOSITORIES]

Goal: SQLite In-Memory Integration.

Imports: import { Database } from "bun:sqlite"; import { drizzle } from "drizzle-orm/bun-sqlite";

Setup:
let testDb = new Database(":memory:"); testDb.exec("CREATE TABLE..."); const repo = new Repo({ db: drizzle(testDb) });
afterEach(() => testDb.close());

[PRESENTATION_AND_ROUTES (CRITICAL)]

Goal: Test Elysia API endpoints WITHOUT calling .listen().

Dependencies: You MUST Mock the Awilix DI container perfectly using createContainer and asValue.

AVOIDING DB CRASHES: Route files usually import auth.ts or db.ts which execute top-level DB connections. You MUST mock these modules using mock.module BEFORE importing the actual route file.

Setup Example (CRITICAL STRUCTURE):

import { describe, it, expect, beforeEach, mock } from "bun:test";

// 1. MUST BE AT THE VERY TOP: Prevent actual DB connection from top-level imports
mock.module("../infrastructure/auth/auth", () => ({
  auth: {
    api: {
      generateOpenAPISchema: mock().mockResolvedValue({ components: {}, paths: {} }),
      getSession: mock().mockResolvedValue(null) // Override inside tests if needed
    },
    handler: mock()
  }
}));

// 2. NOW we can safely import Awilix and the Routes
import { createContainer, asValue } from "awilix";
import { createApp } from "./routes"; // Adjust path

process.env.NODE_ENV = "test"; // Bypass logs

describe("Routes Test", () => {
  let testApp: any;

  beforeEach(async () => {
    // 3. Setup Awilix Container
    const di = createContainer();
    di.register({ 
      userManager: asValue({ 
        create: mock().mockResolvedValue({ id: '1' }), 
        findById: mock().mockResolvedValue(null) 
      } as any) 
    });

    // 4. Create Elysia App safely
    testApp = await createApp(di as any);
  });

  it("should handle base request", async () => {
    const res = await testApp.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
  });
});


Requests: const res = await testApp.handle(new Request('http://localhost/path', { method: 'POST', body: JSON.stringify({...}) }));

Response Body: Use await res.json(); or await res.text(); to read the response.
</layer_strategies>

<code_structure>

AAA Pattern (Arrange, Act, Assert).

English block names: describe("..."), it("should ...").

Error Handling: try { await func(); } catch (e: any) { expect(e.statusCode).toBe(400); }
</code_structure>