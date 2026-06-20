import { User } from "../domain/user";
import { UserRepository } from "../domain/userRepository";
import { NotFoundError } from "../errors";

export class UserManager {
  private userRepository: UserRepository;
  constructor(deps: { userRepository: UserRepository }) {
    this.userRepository = deps.userRepository;
  }

  async create(data: Omit<User, "id">): Promise<User | null> {
    return this.userRepository.create(data);
  }

  async getById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }

  async update(
    id: string,
    data: Partial<Omit<User, "id">>,
  ): Promise<User | null> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Usuário com ID ${id} não encontrado.`);
    }

    return this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const exists = await this.userRepository.findById(id);
    if (!exists) {
      throw new NotFoundError(`Usuário com ID ${id} não encontrado.`);
    }

    return this.userRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async updateByEmail(
    email: string,
    data: Partial<Omit<User, "id">> | {},
  ): Promise<User | null> {
    const existing = await this.userRepository.findByEmail(email);
    if (!existing) {
      throw new NotFoundError(`Usuário com e-mail ${email} não encontrado.`);
    }

    return this.userRepository.updateByEmail(email, data);
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError(`Usuário com e-mail ${email} não encontrado.`);
    }

    await this.userRepository.deleteByEmail(email);
    return true;
  }
}
