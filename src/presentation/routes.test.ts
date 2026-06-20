import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { createApp } from "./routes";
import { db } from "../infrastructure/db";
import { users } from "../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { UserManager } from "../core/usecases/userManager";
import { DrizzleUserRepository } from "../infrastructure/repositories/userRepository";

const BASE_URL = "http://localhost";

describe("Presentation Layer - API Routes (Isolated Tests)", () => {
  let testApp: any;
  let testUserManager: UserManager;

  beforeEach(async () => {
    await db.delete(users);
    const repository = new DrizzleUserRepository(db);
    testUserManager = new UserManager(repository);

    testApp = createApp(testUserManager);
  });

  afterAll(async () => {
    await db.delete(users);
  });

  it("GET / should return the online message", async () => {
    const response = await testApp.handle(new Request(`${BASE_URL}/`));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("A API Elysia + Drizzle está online!");
  });

  it("POST /users should create a new user with unique data", async () => {
    const uniqueId = Date.now();
    const userData = {
      name: `User ${uniqueId}`,
      age: 25,
      email: `user${uniqueId}@test.com`,
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/users`, {
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
      new Request(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidData),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("GET /users should return all users", async () => {
    await testApp.handle(
      new Request(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "U1", age: 20, email: "u1@test.com" }),
      }),
    );
    await testApp.handle(
      new Request(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "U2", age: 21, email: "u2@test.com" }),
      }),
    );

    const response = await testApp.handle(new Request(`${BASE_URL}/users`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it("PUT /users/:email should update a user", async () => {
    const email = `update${Date.now()}@test.com`;

    await testApp.handle(
      new Request(`${BASE_URL}/users`, {
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
      new Request(`${BASE_URL}/users`, {
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
