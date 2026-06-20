// src/core/domain/userRepository.ts
import { User } from "./user";

export interface UserRepository {
  create(data: Omit<User, "id">): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateByEmail(email: string, data: Partial<Omit<User, "id">>): Promise<User | null>;
  deleteByEmail(email: string): Promise<boolean>;
  findAll(): Promise<User[]>;
}