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
    role: UserRole.VIEWER,
  };

  beforeEach(() => {
    mockUserRepository = {
      create: mock().mockResolvedValue(mockUser),
      findById: mock().mockResolvedValue(mockUser),
      findAll: mock().mockResolvedValue([mockUser]),
      updateByEmail: mock().mockResolvedValue(mockUser),
      deleteByEmail: mock().mockResolvedValue(true),
    };
    userManager = new UserManager({ userRepository: mockUserRepository });
  });

  describe("create", () => {
    it("should call repository.create and return the created user", async () => {
      const data = { name: "Test", age: 30, email: "test@test.com" };
      const result = await userManager.create(data as any);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe("getById", () => {
    it("should call repository.findById and return the user", async () => {
      const id = MOCK_USER_ID;
      const result = await userManager.getById(id);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(id);
    });
  });

  describe("findAll", () => {
    it("should call repository.findAll and return a list of users", async () => {
      const result = await userManager.findAll();

      expect(result).toEqual([mockUser]);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("updateByEmail", () => {
    it("should update the user and return it when successful", async () => {
      const email = "test@test.com";
      const data = { age: 35 };
      mockUserRepository.updateByEmail.mockResolvedValue({ ...mockUser, age: 35 });

      const result = await userManager.updateByEmail(email, data as any);

      expect(result.age).toBe(35);
      expect(mockUserRepository.updateByEmail).toHaveBeenCalledWith(email, data);
    });

    it("should throw AppError when the user to update is not found", async () => {
      const email = "notfound@test.com";
      mockUserRepository.updateByEmail.mockResolvedValue(null);

      try {
        await userManager.updateByEmail(email, { age: 40 });
        expect.fail("Should have thrown an AppError");
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
      }
    });
  });

  describe("deleteByEmail", () => {
    it("should return true when the user is successfully deleted", async () => {
      const email = "test@test.com";
      mockUserRepository.deleteByEmail.mockResolvedValue(true);

      const result = await userManager.deleteByEmail(email);

      expect(result).toBe(true);
      expect(mockUserRepository.deleteByEmail).toHaveBeenCalledWith(email);
    });

    it("should throw AppError when the user to delete is not found", async () => {
      const email = "notfound@test.com";
      mockUserRepository.deleteByEmail.mockResolvedValue(false);

      try {
        await userManager.deleteByEmail(email);
        expect.fail("Should have thrown an AppError");
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
      }
    });
  });
});
