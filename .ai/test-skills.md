<output_constraints>

OUTPUT ONLY VALID TYPESCRIPT CODE.

ENCLOSE CODE in a single ```typescript block.

ZERO explanations, ZERO markdown text outside the code block.

ASSUME COLOCATION: The test file is in the EXACT SAME folder as the source file. Use ./filename to import the tested module.

TYPESCRIPT FIX: Always cast mock objects with as any when passing them to constructors/functions to avoid TS strict type errors.
</output_constraints>

<framework_rules>

Runner: ONLY bun:test (describe, it, expect, mock, spyOn, beforeEach, afterEach). NO Jest/Vitest.

Mocking: Use mock().mockResolvedValue(...) or mock().mockReturnValue(...).
</framework_rules>

<layer_strategies>
[USE_CASES]

Goal: Pure logic isolation.

Action: Mock injected Awilix dependencies.

Example:
const mockRepo = { findById: mock().mockResolvedValue(null) };
const sut = new Manager({ repo: mockRepo as any });

[REPOSITORIES]

Goal: SQLite In-Memory Integration.

Imports: import { Database } from "bun:sqlite"; import { drizzle } from "drizzle-orm/bun-sqlite";

Setup:
beforeEach(() => { db = new Database(":memory:"); db.exec("CREATE TABLE..."); repo = new Repo({ db: drizzle(db) }); });
afterEach(() => { db.close(); });

[PRESENTATION_AND_ROUTES]

Goal: API endpoint testing without starting the server.

Web Framework: Elysia. DO NOT call .listen().

Container Mocking (Awilix): If testing createApp(di), create a mock container:
import { createContainer, asValue } from "awilix";
const di = createContainer(); di.register({ userManager: asValue({ /* mocks */ }) });
const app = await createApp(di);

Request: const res = await app.handle(new Request('http://localhost/path'));

Auth Mock: spyOn(auth.api, "getSession").mockResolvedValue({ session: { role: 'ADMIN' } } as any);
</layer_strategies>

<code_structure>

AAA Pattern (Arrange, Act, Assert).

Block names it("should ...") in English.

Try/Catch for Errors: try { await func(); } catch (e: any) { expect(e.statusCode).toBe(400); }
</code_structure>