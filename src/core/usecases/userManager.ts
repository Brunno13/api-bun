import { UserRepository } from "../domain/userRepository";
import { User } from "../domain/user";
import { AppError } from "../errors/appError";
import { ErrorCode } from "../messages/messages";

export class UserManager {
  private userRepository: UserRepository;

  constructor(deps: { userRepository: UserRepository }) {
    this.userRepository = deps.userRepository;
  }

  async create(data: Omit<User, "id">): Promise<User | null> {
    return this.userRepository.create(data);
  }

  async getById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async updateByEmail(
    email: string,
    data: Partial<Omit<User, "id">>,
  ): Promise<User> {
    const updatedUser = await this.userRepository.updateByEmail(email, data);
    
    if (!updatedUser) {
      throw new AppError(ErrorCode.USER_NOT_FOUND);
    }
    
    return updatedUser;
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const wasDeleted = await this.userRepository.deleteByEmail(email);
    
    if (!wasDeleted) {
      throw new AppError(ErrorCode.USER_NOT_FOUND);
    }
    
    return true;
  }
}