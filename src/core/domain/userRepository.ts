import { User } from "./User";

export interface UserRepository {
  create(data: Omit<User, "id">): Promise<User>;
  findById(id: number): Promise<User | null>;
  update(id: number, data: Partial<Omit<User, "id">>): Promise<User>;
  delete(id: number): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
  updateByEmail(email: string, data: Partial<Omit<User, "id">>): Promise<User>;
  deleteByEmail(email: string): Promise<boolean>;
  findAll(): Promise<User[]>;
}
