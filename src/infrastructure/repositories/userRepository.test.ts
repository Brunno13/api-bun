import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { DrizzleUserRepository } from "./userRepository";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { UserRole } from "../../core/messages/messages";

describe("DrizzleUserRepository Integration Tests", () => {
  let testDb: Database;
  let testDbInstance: BunSQLiteDatabase;
  let repository: DrizzleUserRepository;

  beforeEach(async () => {
    // Setup in-memory database for integration testing
    testDb = new Database(":memory:");
    testDbInstance = drizzle(testDb);

    // Create the schema manually to ensure the repository can interact with it
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

  it("should create a new user and apply default values", async () => {
    // Arrange
    const userData = { name: "John Doe", email: "john@test.com", age: 30 };

    // Act
    const result = await repository.create(userData as any);

    // Assert
    expect(result).not.toBeNull();
    expect(result!.id).toBeDefined();
    expect(result!.name).toBe(userData.name);
    expect(result!.email).toBe(userData.email);
    expect(result!.role).toBe(UserRole.VIEWER); // Verifies default logic in create/mapToDomain
  });

  it("should find a user by their unique ID", async () => {
    // Arrange
    const userData = { name: "Jane Doe", email: "jane@test.com", age: 25, role: UserRole.ADMIN };
    const created = await repository.create(userData as any);
    const id = created!.id!;

    // Act
    const found = await repository.findById(id);

    // Assert
    expect(found).not.toBeNull();
    expect(found?.id).toBe(id);
    expect(found?.name).toBe(userData.name);
    expect(found?.role).toBe(UserRole.ADMIN);
  });

  it("should return null when searching for a non-existent ID", async () => {
    // Act
    const found = await repository.findById("non_existent_id");

    // Assert
    expect(found).toBeNull();
  });

  it("should find a user by their email address", async () => {
    // Arrange
    const email = "find@test.com";
    await repository.create({ name: "Find Me", email, age: 20 } as any);

    // Act
    const found = await repository.findByEmail(email);

    // Assert
    expect(found).not.toBeNull();
    expect(found?.email).toBe(email);
  });

  it("should update an existing user's information by email", async () => {
    // Arrange
    const email = "update@test.com";
    await repository.create({ name: "Old Name", email, age: 20 } as any);

    // Act
    const updated = await repository.updateByEmail(email, { name: "New Name" });

    // Assert
    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("New Name");
    expect(updated?.email).toBe(email);
  });

  it("should return null when trying to update a non-existent email", async () => {
    // Act
    const updated = await repository.updateByEmail("ghost@test.com", { name: "Ghost" });

    // Assert
    expect(updated).toBeNull();
  });

  it("should delete a user by email and return true", async () => {
    // Arrange
    const email = "delete@test.com";
    await repository.create({ name: "Delete Me", email, age: 10 } as any);

    // Act
    const success = await repository.deleteByEmail(email);

    // Assert
    expect(success).toBe(true);
    const found = await repository.findByEmail(email);
    expect(found).toBeNull();
  });

  it("should return false when trying to delete a non-existent email", async () => {
    // Act
    const success = await repository.deleteByEmail("no_one@test.com");

    // Assert
    expect(success).toBe(false);
  });

  it("should retrieve all users from the database", async () => {
    // Arrange
    await repository.create({ name: "User 1", email: "u1@test.com", age: 20 } as any);
    await repository.create({ name: "User 2", email: "u2@test.com", age: 30 } as any);

    // Act
    const all = await repository.findAll();

    // Assert
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(2);
    expect(all[0].name).toBe("User 1");
    expect(all[1].name).toBe("User 2");
  });
});
