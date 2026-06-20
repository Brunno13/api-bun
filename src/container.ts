import { createContainer, InjectionMode, asValue, asClass } from "awilix";
import { db } from "./infrastructure/db/db";
import { DrizzleUserRepository } from "./infrastructure/repositories/userRepository";
import { UserManager } from "./core/usecases/userManager";

export const setupContainer = () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    db: asValue(db),
    userRepository: asClass(DrizzleUserRepository).singleton(),
    userManager: asClass(UserManager).singleton(),
  });

  return container;
};
