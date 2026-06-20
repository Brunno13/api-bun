import { userProviders } from "./di/user.registry";

const providers = {
  ...userProviders(getDependency),
};

const instances = new Map<string, any>();

function getDependency(name: keyof typeof providers): any {
  if (!instances.has(name)) {
    const provider = providers[name];
    instances.set(name, typeof provider === "function" ? provider() : provider);
  }
  return instances.get(name);
}

export const container = {
  get: getDependency,
};
