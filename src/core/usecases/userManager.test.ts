import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UserManager } from "./userManager";
import { AppError } from "../errors/appError";
import { ErrorCode, HttpStatus, UserRole } from "../messages/messages";
import type { UserRepository } from "../domain/userRepository";
import type { User } from "../domain/user";

describe("UserManager Unit Tests", () => {
  let userManager: UserManager;
  let mockUserRepository: MockUserRepository;

  const MOCK_USER_ID = "mock-uuid-1234-5678";

  const mockUser: User = {
    id: MOCK_USER_ID,
    name: "Test",
    age: 30,
    email: "test@test.com",
    role: UserRole.VIEWER,
  };

  const createMockUserRepository = () => ({
    create: mock(
      (): Promise<User | null> => Promise.resolve(mockUser),
    ),

    findById: mock(
      (): Promise<User | null> => Promise.resolve(mockUser),
    ),

    findByEmail: mock(
      (): Promise<User | null> => Promise.resolve(mockUser),
    ),

    findAll: mock(
      (): Promise<User[]> => Promise.resolve([mockUser]),
    ),

    updateByEmail: mock(
      (): Promise<User | null> => Promise.resolve(mockUser),
    ),

    deleteByEmail: mock(
      (): Promise<boolean> => Promise.resolve(true),
    ),
  }) satisfies UserRepository;

  type MockUserRepository =
    ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();

    userManager = new UserManager({
      userRepository: mockUserRepository,
    });
  });

  describe("create", () => {
    it("should call repository.create and return the created user", async () => {
      const data = { name: "Test", age: 30, email: "test@test.com" };
      const result = await userManager.create(data);

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

      const result = await userManager.updateByEmail(email, data);

      expect(result.age).toBe(35);
      expect(mockUserRepository.updateByEmail).toHaveBeenCalledWith(email, data);
    });

    it("should throw AppError when the user to update is not found", async () => {
      const email = "notfound@test.com";
      mockUserRepository.updateByEmail.mockResolvedValue(null);

      let thrown: unknown;

      try {
        await userManager.updateByEmail(email, { age: 40 });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(AppError);

      if (!(thrown instanceof AppError)) {
        throw new Error("Expected userManager.updateByEmail to throw AppError");
      }

      expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(thrown.code).toBe(ErrorCode.USER_NOT_FOUND);
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

      let thrown: unknown;

      try {
        await userManager.deleteByEmail(email);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(AppError);

      if (!(thrown instanceof AppError)) {
        throw new Error("Expected userManager.deleteByEmail to throw AppError");
      }

      expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(thrown.code).toBe(ErrorCode.USER_NOT_FOUND);
    });
  });
});
