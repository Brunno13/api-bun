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
</framework_rules>

<layer_strategies>
[USE_CASES]

Goal: Isolate logic. Mock injected dependencies.

Example:
const manager = new Manager({ repo: { findById: mock() } as any });

[REPOSITORIES]

Goal: SQLite In-Memory Integration.

Imports: import { Database } from "bun:sqlite"; import { drizzle } from "drizzle-orm/bun-sqlite";

Setup:
let testDb = new Database(":memory:"); testDb.exec("CREATE TABLE..."); const repo = new Repo({ db: drizzle(testDb) });
afterEach(() => testDb.close());

[PRESENTATION_AND_ROUTES (CRITICAL)]

Goal: Test Elysia API endpoints WITHOUT .listen().

Dependencies: You MUST Mock the Awilix DI container perfectly using createContainer and asValue.

Setup Example:

import { createContainer, asValue } from "awilix";
import { createApp } from "./routes"; // import the file you are testing

const di = createContainer();
di.register({ userManager: asValue({ create: mock(), findById: mock() } as any) });
const app = await createApp(di as any);


Requests: const res = await app.handle(new Request('http://localhost/path'));

Response Body: Use await res.json(); or await res.text(); to read the response.

Better Auth (RBAC): If the route is protected, mock the session:
spyOn(auth.api, "getSession").mockResolvedValue({ session: { role: 'ADMIN' } } as any);
</layer_strategies>

<code_structure>

AAA Pattern (Arrange, Act, Assert).

English block names: describe("..."), it("should ...").

Error Handling: try { await func(); } catch (e: any) { expect(e.statusCode).toBe(400); }
</code_structure>