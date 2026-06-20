import { db } from "./infrastructure/db";
import { DrizzleUserRepository } from "./infrastructure/repositories/userRepository";
import { UserManager } from "./core/usecases/userManager";

const providers = {
  db,
  userRepository: () => new DrizzleUserRepository(db),
  userManager: () => new UserManager(getDependency("userRepository")),
};

const instances = new Map<string, any>();

function getDependency(name: string): any {
  if (!instances.has(name)) {
    const provider = providers[name];
    if (typeof provider === "function") {
      instances.set(name, provider());
    } else {
      return provider;
    }
  }
  return instances.get(name);
}

export const container = {
  get: getDependency,
  userDomain: {
    userManager: getDependency("userManager"),
  },
};
