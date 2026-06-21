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

BETTER AUTH MOCKING (CRITICAL): You MUST spy on Better Auth API methods called during route creation (like generateOpenAPISchema).

Setup Example:

import { describe, it, expect, beforeEach, spyOn, mock } from "bun:test";
import { createContainer, asValue } from "awilix";
import { auth } from "../../infrastructure/auth/auth"; // Adjust path
import { createApp } from "./routes"; // Adjust path

describe("Routes Test", () => {
  let testApp: any;

  beforeEach(async () => {
    // 1. CRITICAL: Prevent Better Auth from crashing the test during Elysia instantiation
    spyOn(auth.api, "generateOpenAPISchema").mockResolvedValue({ components: {}, paths: {} } as any);

    // 2. Setup Awilix Container
    const di = createContainer();
    di.register({ 
      userManager: asValue({ 
        create: mock().mockResolvedValue({ id: '1' }), 
        findById: mock().mockResolvedValue(null) 
      } as any) 
    });

    // 3. Create Elysia App
    testApp = await createApp(di as any);
  });

  it("should handle request", async () => {
    // Mock session for protected/RBAC routes
    spyOn(auth.api, "getSession").mockResolvedValue({ session: { role: 'ADMIN' } } as any);

    const res = await testApp.handle(new Request('http://localhost/path'));
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