import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { Elysia } from "elysia";
import { createContainer, asValue } from "awilix";
import { userRoutes } from "./user.routes";
import { UserManager } from "../../core/usecases/userManager";
import { DrizzleUserRepository } from "../../infrastructure/repositories/userRepository";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { auth } from "../../infrastructure/auth/auth";

const BASE_URL = "http://localhost";

describe("Presentation Layer - User Routes", () => {
  let testApp: any;
  let testUserManager: UserManager;
  let testDb: Database;
  let testDbInstance: BunSQLiteDatabase;

  beforeEach(async () => {
    spyOn(auth.api, "getSession").mockResolvedValue({
      session: {
        id: "mock-session-123",
        userId: "mock-uuid-999",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "mock-token",
        ipAddress: "127.0.0.1",
        userAgent: "Bun Test",
      },
      user: {
        id: "mock-uuid-999",
        name: "Usuário VIP",
        email: "admin@test.com",
        age: 30,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
    });

    testDb = new Database(":memory:");
    testDbInstance = drizzle(testDb);

    testDb.exec(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER NOT NULL,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    const repository = new DrizzleUserRepository({ db: testDbInstance });
    testUserManager = new UserManager({ userRepository: repository });

    const testContainer = createContainer();
    testContainer.register({
      userManager: asValue(testUserManager),
    });

    testApp = new Elysia().use(userRoutes(testContainer));
  });

  afterEach(() => {
    testDb.close();
  });

  it("POST /users should create a new user with unique data", async () => {
    const uniqueId = Date.now();
    const userData = {
      name: `User ${uniqueId}`,
      age: 25,
      email: `user${uniqueId}@test.com`,
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(userData.name);
    expect(body.email).toBe(userData.email);
  });

  it("POST /users should return 422 for invalid data", async () => {
    const invalidData = {
      name: "",
      age: -1,
      email: "not-an-email",
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidData),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("GET /users should return all users", async () => {
    await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "U1", age: 20, email: "u1@test.com" }),
      }),
    );

    const response = await testApp.handle(new Request(`${BASE_URL}/users/`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("PUT /users/:email should update a user", async () => {
    const email = `update${Date.now()}@test.com`;

    await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Old Name", age: 20, email }),
      }),
    );

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 30 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.age).toBe(30);
  });

  it("DELETE /users/:email should delete a user", async () => {
    const email = `delete${Date.now()}@test.com`;

    await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "To Be Deleted", age: 20, email }),
      }),
    );

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/${email}`, {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Usuário deletado com sucesso!");
  });
});