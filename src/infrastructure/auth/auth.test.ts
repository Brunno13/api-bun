import { describe, expect, it, mock } from "bun:test";
import { runAdminBootstrap, type AdminBootstrapDependencies } from "./auth";
import { UserRole } from "../../core/messages/messages";

describe("Admin bootstrap", () => {
  it("should skip bootstrap when credentials are not configured", async () => {
    const adminExists = mock(() => Promise.resolve(false));

    const signUpEmail = mock(() =>
      Promise.reject(new Error("signUpEmail should not be called")),
    );

    const dependencies = {
      adminExists,
      signUpEmail,
    } satisfies AdminBootstrapDependencies;

    await runAdminBootstrap(
      undefined,
      undefined,
      dependencies,
    );

    expect(adminExists).toHaveBeenCalledTimes(0);
    expect(signUpEmail).toHaveBeenCalledTimes(0);
  });

  it("should skip creation when bootstrap admin already exists", async () => {
    const adminExists = mock(() => Promise.resolve(true));

    const signUpEmail = mock(() =>
        Promise.reject(new Error("signUpEmail should not be called")),
    );

    const dependencies = {
        adminExists,
        signUpEmail,
    } satisfies AdminBootstrapDependencies;

    await runAdminBootstrap(
        "admin@example.com",
        "strong-password",
        dependencies,
    );

    expect(adminExists).toHaveBeenCalledTimes(1);
    expect(adminExists).toHaveBeenCalledWith("admin@example.com");

    expect(signUpEmail).toHaveBeenCalledTimes(0);
  });

  it("should attempt to create bootstrap admin when user does not exist", async () => {
    const adminExists = mock(() => Promise.resolve(false));

    const signUpEmail = mock(() =>
        Promise.reject(new Error("simulated sign-up failure")),
    );

    const dependencies = {
        adminExists,
        signUpEmail,
    } satisfies AdminBootstrapDependencies;

    await runAdminBootstrap(
        "admin@example.com",
        "strong-password",
        dependencies,
    );

    expect(adminExists).toHaveBeenCalledTimes(1);
    expect(adminExists).toHaveBeenCalledWith("admin@example.com");

    expect(signUpEmail).toHaveBeenCalledTimes(1);
    expect(signUpEmail).toHaveBeenCalledWith({
        body: {
        name: "Administrador do Sistema",
        email: "admin@example.com",
        password: "strong-password",
        age: 99,
        role: UserRole.ADMIN,
        },
    });
  });
});