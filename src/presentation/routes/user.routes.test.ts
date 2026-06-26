import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { createContainer, asValue } from "awilix";
import { UserManager } from "../../core/usecases/userManager";
import { DrizzleUserRepository } from "../../infrastructure/repositories/userRepository";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { auth } from "../../infrastructure/auth/auth";
import { UserRole, HttpStatus } from "../../core/messages/messages";
import { createApp } from "../routes";

const BASE_URL = "http://localhost";

describe("Presentation Layer - User Routes (RBAC)", () => {
  let testApp: any;
  let testUserManager: UserManager;
  let testDb: Database;
  let testDbInstance: BunSQLiteDatabase;

  const mockSessionWithRole = (role: UserRole) => {
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
        name: "Usuário Teste",
        email: "user@test.com",
        age: 30,
        role: role,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
    } as any);
  };

  beforeEach(async () => {
    mockSessionWithRole(UserRole.ADMIN);

    testDb = new Database(":memory:");
    testDbInstance = drizzle(testDb);

    // Initialize schema in memory
    testDb.exec(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
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
      storageService: asValue({ upload: async () => "http://mock-url.com" }),
    });

    testApp = await createApp(testContainer);
  });

  afterEach(() => {
    testDb.close();
  });

  it("POST /users should create a user when session is ADMIN", async () => {
    mockSessionWithRole(UserRole.ADMIN);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "New User", 
          age: 25, 
          email: "new@test.com", 
          role: UserRole.VIEWER 
        }),
      }),
    );

    expect(response.status).toBe(HttpStatus.OK);
    const body = await response.json();
    expect(body).toHaveProperty("id");
  });

  it("POST /users should return 403 FORBIDDEN when session is VIEWER", async () => {
    mockSessionWithRole(UserRole.VIEWER);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "Unauthorized User", 
          age: 25, 
          email: "unauth@test.com" 
        }),
      }),
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it("GET /users should allow VIEWER to list all users", async () => {
    mockSessionWithRole(UserRole.VIEWER);

    const response = await testApp.handle(new Request(`${BASE_URL}/users/`));
    expect(response.status).toBe(HttpStatus.OK);
  });

  it("PUT /users/:email should allow EDITOR to update a user", async () => {
    mockSessionWithRole(UserRole.EDITOR);

    // Seed data for the update operation
    await testUserManager.create({ 
      name: "Old Name", 
      age: 20, 
      email: "update@test.com", 
      role: UserRole.VIEWER 
    } as any);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/update@test.com`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 35 }),
      }),
    );

    expect(response.status).toBe(HttpStatus.OK);
  });

  it("PUT /users/:email should return 403 FORBIDDEN for VIEWER", async () => {
    mockSessionWithRole(UserRole.VIEWER);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/update@test.com`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 35 }),
      }),
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it("DELETE /users/:email should allow ADMIN to delete a user", async () => {
    mockSessionWithRole(UserRole.ADMIN);

    // Seed data for the deletion operation
    await testUserManager.create({ 
      name: "Delete Me", 
      age: 20, 
      email: "delete@test.com", 
      role: UserRole.VIEWER 
    } as any);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/delete@test.com`, { method: "DELETE" }),
    );

    expect(response.status).toBe(HttpStatus.OK);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("DELETE /users/:email should return 403 FORBIDDEN for EDITOR", async () => {
    mockSessionWithRole(UserRole.EDITOR);

    await testUserManager.create({ 
      name: "Delete Me", 
      age: 20, 
      email: "delete@test.com", 
      role: UserRole.VIEWER 
    } as any);

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users/delete@test.com`, { method: "DELETE" }),
    );

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });
});
