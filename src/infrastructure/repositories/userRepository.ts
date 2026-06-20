import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { UserRepository } from "../../core/domain/userRepository";
import { User } from "../../core/domain/user";
import { SqliteDatabase } from "drizzle-orm/bun-sqlite";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: SqliteDatabase) {}

  async create(data: Omit<User, "id">): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : null;
  }

  async update(id: number, data: Partial<Omit<User, "id">>): Promise<User> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateByEmail(email: string, data: Partial<Omit<User, "id">>): Promise<User> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.email, email))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    await this.db.delete(users).where(eq(users.id, id));
    return true;
  }

  async deleteByEmail(email: string): Promise<boolean> {
    await this.db.delete(users).where(eq(users.email, email));
    return true;
  }

  async findAll(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result;
  }
}
