import { describe, it, expect, beforeEach } from "bun:test";
import { createApp } from "./routes";
import { createContainer, asValue } from "awilix";
import { ErrorCode, FrameworkErrorCode, HttpStatus, MESSAGES } from "../core/messages/messages";

const BASE_URL = "http://localhost";
const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const readJsonObject = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  const value: unknown = await response.json();

  if (!isRecord(value)) {
    throw new Error("Expected response body to be a JSON object");
  }

  return value;
};

describe("Presentation Layer - Global API Routes", () => {
  type TestApp = Awaited<ReturnType<typeof createApp>>;
  let testApp: TestApp;

  beforeEach(async () => {
    const mockContainer = createContainer();

    mockContainer.register({
      storageService: asValue({ upload: () => Promise.resolve("http://mock-url.com") }),
      userManager: asValue({}),
    });

    testApp = await createApp(mockContainer);
  });

  it("GET / should return the online message", async () => {
    const response = await testApp.handle(new Request(`${BASE_URL}/`));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("A API Elysia + Drizzle está online!");
  });

  it("GET /favicon.ico should return 204 status", async () => {
    const response = await testApp.handle(new Request(`${BASE_URL}/favicon.ico`));
    expect(response.status).toBe(204);
  });

  it("GET unknown route should return standardized 404 response", async () => {
    const response = await testApp.handle(
      new Request(`${BASE_URL}/route-that-does-not-exist`),
    );

    expect(response.status).toBe(HttpStatus.NOT_FOUND);

    const body = await readJsonObject(response);

    expect(body.success).toBe(false);
    expect(body.code).toBe(FrameworkErrorCode.NOT_FOUND);
    expect(body.message).toBe(
      MESSAGES.ERROR[ErrorCode.ROUTE_NOT_FOUND].message,
    );
  });
});
