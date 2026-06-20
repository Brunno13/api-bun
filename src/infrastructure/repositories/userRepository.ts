import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { UserRepository } from "../../core/domain/UserRepository";
import { User } from "../../core/domain/User";

export class DrizzleUserRepository implements UserRepository {
  async create(data: Omit<User, "id">): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async findById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : null;
  }

  async update(id: number, data: Partial<Omit<User, "id">>): Promise<User> {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateByEmail(
    email: string,
    data: Partial<Omit<User, "id">>,
  ): Promise<User> {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.email, email))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async deleteByEmail(email: string): Promise<boolean> {
    await db.delete(users).where(eq(users.email, email));
    return true;
  }

  async findAll(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }
}
