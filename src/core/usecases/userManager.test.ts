import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UserManager } from "./userManager";
import { AppError } from "../errors";

describe("UserManager Unit Tests", () => {
  let userManager: UserManager;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      create: mock().mockResolvedValue({
        id: 1,
        name: "Test",
        age: 30,
        email: "test@test.com",
      }),
      findById: mock().mockResolvedValue({
        id: 1,
        name: "Test",
        age: 30,
        email: "test@test.com",
      }),
      update: mock().mockResolvedValue({
        id: 1,
        name: "Test",
        age: 30,
        email: "test@test.com",
      }),
      delete: mock().mockResolvedValue(true),
      findAll: mock().mockResolvedValue([
        { id: 1, name: "Test", age: 30, email: "test@test.com" },
      ]),
      updateByEmail: mock().mockResolvedValue({
        id: 1,
        name: "Test",
        age: 30,
        email: "test@test.com",
      }),
      findByEmail: mock().mockResolvedValue(null),
      deleteByEmail: mock().mockResolvedValue(true),
    };
    userManager = new UserManager(mockUserRepository);
  });

  describe("Delegation Methods", () => {
    it("should call userRepository.create", async () => {
      const data = { name: "Test", age: 30, email: "test@test.com" };
      await userManager.create(data);
      expect(mockUserRepository.create).toHaveBeenCalledWith(data);
    });

    it("should call userRepository.getById", async () => {
      const id = 1;
      await userManager.getById(id);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
    });

    it("should call userRepository.findAll", async () => {
      await userManager.findAll();
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("deleteByEmail", () => {
    it("should return success when user is deleted", async () => {
      const email = "test@test.com";
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        name: "Test",
        age: 30,
        email,
      });
      mockUserRepository.deleteByEmail.mockResolvedValue(true);

      const result = await userManager.deleteByEmail(email);

      expect(result).toBe(true);
    });

    it("should throw error when user is not found", async () => {
      const email = "notfound@test.com";
      mockUserRepository.findByEmail.mockResolvedValue(null);

      try {
        await userManager.deleteByEmail(email);
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(40400);
        expect(error.errorCode).toBe("NOT_FOUND");
      }
    });

    it("should throw error when exception occurs", async () => {
      const email = "test@test.com";
      mockUserRepository.findByEmail.mockRejectedValue(new Error("Database failure"));

      await expect(userManager.deleteByEmail(email)).rejects.toThrow();
    });
  });
});
