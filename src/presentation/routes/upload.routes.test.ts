import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { createContainer, asValue } from "awilix";
import { auth } from "../../infrastructure/auth/auth";
import { UserRole, HttpStatus, MESSAGES, ErrorCode } from "../../core/messages/messages";
import { createApp } from "../routes";
import type { StorageService } from "../../core/domain/storageService";

const BASE_URL = "http://localhost";

describe("Presentation Layer - Upload Routes", () => {
  let testApp: any;
  let mockStorageService: StorageService;

  const mockSessionWithRole = (role: UserRole) => {
    spyOn(auth.api, "getSession").mockResolvedValue({
      session: {
        id: "mock-session-123",
        userId: "mock-uuid-999",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "mock-token",
        ipAddress: "127.0.0.1",
        userAgent: "Bun Test",
      },
      user: {
        id: "mock-uuid-999",
        name: "Usuário Teste",
        email: "user@test.com",
        age: 30,
        role: role,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
    } as any);
  };

  const mockNoSession = () => {
    spyOn(auth.api, "getSession").mockResolvedValue(null);
  };

  beforeEach(async () => {
    mockSessionWithRole(UserRole.VIEWER);

    mockStorageService = {
      upload: mock().mockResolvedValue("http://localhost:3902/avatares/fake-uuid.jpg"),
      getFile: mock().mockResolvedValue({
        buffer: Buffer.from("fake-image-data"),
        contentType: "image/jpeg"
      }),
    };

    const testContainer = createContainer();
    testContainer.register({
      storageService: asValue(mockStorageService),
      userManager: asValue({}), 
    });

    testApp = await createApp(testContainer);
  });

  afterEach(() => {
    mock().mockRestore();
  });

  it("POST /api/avatar deve fazer o upload com sucesso e retornar a URL pública", async () => {
    // 🔥 Agora enviamos um JSON puro no formato esperado
    const payload = {
      avatarBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", 
      fileName: "avatar.jpg",
      mimeType: "image/jpeg"
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/api/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(HttpStatus.OK);
    const body = await response.json();
    
    expect(body.success).toBe(true);
    expect(body.message).toBe(MESSAGES.SUCCESS.AVATAR_UPLOADED);
    expect(body.url).toBe("http://localhost:3902/avatares/fake-uuid.jpg");
    expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
  });

  it("POST /api/avatar deve retornar 401 UNAUTHORIZED se não houver sessão activa", async () => {
    mockNoSession();

    const payload = {
      avatarBase64: "base64-string",
      fileName: "teste.png",
      mimeType: "image/png"
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/api/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(mockStorageService.upload).toHaveBeenCalledTimes(0);
  });

  it("POST /api/avatar deve retornar 422 UNPROCESSABLE_ENTITY se o arquivo for inválido (ex: PDF)", async () => {
    // 🔥 Simulando um envio de PDF
    const payload = {
      avatarBase64: "base64-string",
      fileName: "documento.pdf",
      mimeType: "application/pdf"
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/api/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(ErrorCode.INVALID_DATA);
    expect(mockStorageService.upload).toHaveBeenCalledTimes(0);
  });

  it("POST /api/avatar deve propagar erro 500 se o StorageService falhar", async () => {
    mockStorageService.upload = mock().mockRejectedValue(new Error("Conexão recusada"));

    const payload = {
      avatarBase64: "base64-string",
      fileName: "erro.jpg",
      mimeType: "image/jpeg"
    };

    const response = await testApp.handle(
      new Request(`${BASE_URL}/api/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
  });

  it("GET /api/avatar/:filename deve retornar a imagem buscada do storage", async () => {
    const response = await testApp.handle(
      new Request(`${BASE_URL}/api/avatar/test.jpg`, { method: "GET" })
    );

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(mockStorageService.getFile).toHaveBeenCalledWith("test.jpg");
  });
});