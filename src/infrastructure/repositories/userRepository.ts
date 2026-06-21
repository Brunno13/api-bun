import { eq } from "drizzle-orm";
import { user } from "../db/schema";
import { UserRepository } from "../../core/domain/userRepository";
import { User } from "../../core/domain/user";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { UserRole } from "../../core/messages/messages";

export class DrizzleUserRepository implements UserRepository {
  private db: BunSQLiteDatabase;
  
  constructor(deps: { db: BunSQLiteDatabase }) {
    this.db = deps.db;
  }

  private mapToDomain(data: any): User | null {
    if (!data) return null;
    return {
      id: data.id,
      name: data.name ?? "N/A",
      email: data.email ?? "",
      age: data.age ?? 0,
      role: (data.role as UserRole) ?? UserRole.VIEWER,
    };
  }

  async create(data: Omit<User, "id">): Promise<User | null> {
    const now = new Date();

    const result = await this.db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        age: data.age,
        role: data.role ?? UserRole.VIEWER, 
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapToDomain(result[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(user).where(eq(user.id, id));
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email));
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async updateByEmail(
    email: string,
    data: Partial<Omit<User, "id">>,
  ): Promise<User | null> {
    const result = await this.db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.email, email))
      .returning();

    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .delete(user)
      .where(eq(user.email, email))
      .returning();
      
    return result.length > 0;
  }

  async findAll(): Promise<User[]> {
    const result = await this.db.select().from(user);

    return result
      .map((item) => this.mapToDomain(item))
      .filter((u): u is User => u !== null);
  }
} //teste