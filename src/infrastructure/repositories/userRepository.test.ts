import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { DrizzleUserRepository } from "./userRepository";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { UserRole } from "../../core/messages/messages";

describe("DrizzleUserRepository Infrastructure Tests", () => {
  let testDb: Database;
  let testDbInstance: BunSQLiteDatabase;
  let repository: DrizzleUserRepository;

  beforeEach(async () => {
    testDb = new Database(":memory:");
    testDbInstance = drizzle(testDb);

    testDb.exec(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT '${UserRole.VIEWER}',
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    repository = new DrizzleUserRepository({ db: testDbInstance }); 
  });

  afterEach(() => {
    testDb.close();
  });

  it("should create a new user and return it with default role", async () => {
    const userData = { name: "John Doe", email: "john@test.com", age: 30 };
    const result = await repository.create(userData as any);

    expect(result).not.toBeNull();
    expect(result!).toHaveProperty("id");
    expect(result!.name).toBe(userData.name);
    expect(result!.email).toBe(userData.email);
    expect(result!.role).toBe(UserRole.VIEWER);
  });

  it("should find a user by ID", async () => {
    const userData = { name: "Jane Doe", email: "jane@test.com", age: 25, role: UserRole.ADMIN };
    const created = await repository.create(userData as any);

    const found = await repository.findById(created!.id!);
    expect(found).not.toBeNull();
    expect(found?.name).toBe(userData.name);
    expect(found?.role).toBe(UserRole.ADMIN);
  });

  it("should return null if user not found by ID", async () => {
    const found = await repository.findById("999");
    expect(found).toBeNull();
  });

  it("should find a user by email", async () => {
    const email = "find@test.com";
    await repository.create({ name: "Find Me", email, age: 20 } as any);

    const found = await repository.findByEmail(email);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(email);
  });

  // 🚀 TESTES ATUALIZADOS PARA USAR O EMAIL

  it("should update a user by email", async () => {
    const email = "update@test.com";
    const userData = { name: "Old Name", email, age: 20 };
    await repository.create(userData as any);

    const updated = await repository.updateByEmail(email, { name: "New Name" });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("New Name");
  });

  it("should return null when trying to update a non-existent email", async () => {
    const updated = await repository.updateByEmail("ghost@test.com", { age: 99 });
    expect(updated).toBeNull();
  });

  it("should delete a user by email", async () => {
    const email = "del@test.com";
    await repository.create({ name: "Delete Me", email, age: 10 } as any);
    
    const wasDeleted = await repository.deleteByEmail(email);

    expect(wasDeleted).toBe(true);
    
    const found = await repository.findByEmail(email);
    expect(found).toBeNull();
  });

  it("should return false when trying to delete a non-existent email", async () => {
    const wasDeleted = await repository.deleteByEmail("ghost@test.com");
    expect(wasDeleted).toBe(false);
  });

  it("should return all users", async () => {
    await repository.create({ name: "User 1", email: "u1@test.com", age: 20 } as any);
    await repository.create({ name: "User 2", email: "u2@test.com", age: 21 } as any);

    const all = await repository.findAll();
    expect(all.length).toBe(2);
  });
});