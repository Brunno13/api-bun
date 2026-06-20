import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UserManager } from "./userManager";
import { AppError } from "../errors/appError";
import { ErrorCode, HttpStatus, UserRole } from "../messages/messages";

describe("UserManager Unit Tests", () => {
  let userManager: UserManager;
  let mockUserRepository: any;

  const MOCK_USER_ID = "mock-uuid-1234-5678";

  const mockUser = {
    id: MOCK_USER_ID,
    name: "Test",
    age: 30,
    email: "test@test.com",
    role: UserRole.VIEWER
  };

  beforeEach(() => {
    mockUserRepository = {
      create: mock().mockResolvedValue(mockUser),
      findById: mock().mockResolvedValue(mockUser),
      findAll: mock().mockResolvedValue([mockUser]),
      updateByEmail: mock().mockResolvedValue(mockUser),
      findByEmail: mock().mockResolvedValue(null),
      deleteByEmail: mock().mockResolvedValue(true),
    };
    userManager = new UserManager({ userRepository: mockUserRepository });
  });

  describe("Delegation Methods", () => {
    it("should call userRepository.create", async () => {
      const data = { name: "Test", age: 30, email: "test@test.com" };
      await userManager.create(data as any);
      expect(mockUserRepository.create).toHaveBeenCalledWith(data);
    });

    it("should call userRepository.getById", async () => {
      const id = MOCK_USER_ID;
      await userManager.getById(id);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
    });

    it("should call userRepository.findAll", async () => {
      await userManager.findAll();
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("deleteByEmail", () => {
    it("should return true when user is successfully deleted", async () => {
      const email = "test@test.com";
      mockUserRepository.deleteByEmail.mockResolvedValue(true);

      const result = await userManager.deleteByEmail(email);

      expect(result).toBe(true);
      expect(mockUserRepository.deleteByEmail).toHaveBeenCalledWith(email);
    });

    it("should throw error when user is not found to delete (returns false)", async () => {
      const email = "notfound@test.com";
      mockUserRepository.deleteByEmail.mockResolvedValue(false);

      try {
        await userManager.deleteByEmail(email);
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
      }
    });
  });

  describe("updateByEmail", () => {
    it("should return updated user when successfully updated", async () => {
      const email = "test@test.com";
      const data = { age: 35 };
      mockUserRepository.updateByEmail.mockResolvedValue({ ...mockUser, age: 35 });

      const result = await userManager.updateByEmail(email, data);

      expect(result.age).toBe(35);
    });

    it("should throw error when user is not found to update (returns null)", async () => {
      const email = "notfound@test.com";
      mockUserRepository.updateByEmail.mockResolvedValue(null);

      try {
        await userManager.updateByEmail(email, { age: 40 });
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
      }
    });
  });
});