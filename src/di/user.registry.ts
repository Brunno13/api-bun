import { DrizzleUserRepository } from "../infrastructure/repositories/userRepository";
import { UserManager } from "../core/usecases/userManager";
import { db } from "../infrastructure/db/db";

export const userProviders = (get: Function) => ({
  userRepository: () => new DrizzleUserRepository(db),
  userManager: () => new UserManager(get("userRepository")),
});
