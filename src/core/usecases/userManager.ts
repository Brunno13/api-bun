import { User } from "../domain/user";
import { UserRepository } from "../domain/userRepository";
import { AppError } from "../errors";

export class UserManager {
  constructor(private userRepository: UserRepository) {}

  async create(data: Omit<User, "id">): Promise<User> {
    return this.userRepository.create(data);
  }

  async getById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async update(id: number, data: Partial<Omit<User, "id">>): Promise<User> {
    return this.userRepository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.userRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async updateByEmail(
    email: string,
    data: Partial<Omit<User, "id">>,
  ): Promise<User> {
    return this.userRepository.updateByEmail(email, data);
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    }

    await this.userRepository.deleteByEmail(email);
    return true;
  }
}
