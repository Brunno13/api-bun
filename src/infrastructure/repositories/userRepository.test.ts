import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { DrizzleUserRepository } from "./userRepository";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

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

  it("should create a new user and return it", async () => {
    const userData = { name: "John Doe", email: "john@test.com", age: 30 };
    const result = await repository.create(userData);

    expect(result).not.toBeNull();
    expect(result!).toHaveProperty("id");
    expect(result!.name).toBe(userData.name);
    expect(result!.email).toBe(userData.email);
  });

  it("should find a user by ID", async () => {
    const userData = { name: "Jane Doe", email: "jane@test.com", age: 25 };
    const created = await repository.create(userData);

    const found = await repository.findById(created!.id!);
    expect(found).not.toBeNull();
    expect(found?.name).toBe(userData.name);
  });

  it("should return null if user not found by ID", async () => {
    const found = await repository.findById("999");
    expect(found).toBeNull();
  });

  it("should find a user by email", async () => {
    const email = "find@test.com";
    await repository.create({ name: "Find Me", email, age: 20 });

    const found = await repository.findByEmail(email);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(email);
  });

  it("should update a user by ID", async () => {
    const userData = { name: "Old Name", email: "update@test.com", age: 20 };
    const created = await repository.create(userData);

    expect(created).not.toBeNull();

    const updated = await repository.update(created!.id!, { name: "New Name" });

    expect(updated).not.toBeNull();

    expect(updated?.name).toBe("New Name");
    expect(updated?.id).toBe(created!.id);
  });

  it("should delete a user by ID", async () => {
    const created = await repository.create({
      name: "Delete Me",
      email: "del@test.com",
      age: 10,
    });
    const deleted = await repository.delete(created!.id!);

    expect(deleted).toBe(true);
    const found = await repository.findById(created!.id!);
    expect(found).toBeNull();
  });

  it("should return all users", async () => {
    await repository.create({ name: "User 1", email: "u1@test.com", age: 20 });
    await repository.create({ name: "User 2", email: "u2@test.com", age: 21 });

    const all = await repository.findAll();
    expect(all.length).toBe(2);
  });
});
