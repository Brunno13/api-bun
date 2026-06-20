import { describe, it, expect, beforeEach } from "bun:test";
import { createApp } from "./routes";
import { createContainer, asValue } from "awilix";

const BASE_URL = "http://localhost";

describe("Presentation Layer - Global API Routes", () => {
  let testApp: any;

  beforeEach(async () => {
    const mockContainer = createContainer();

    mockContainer.register({
      userManager: asValue({}),
    });

    testApp = await createApp(mockContainer);
  });

  it("GET / should return the online message", async () => {
    const response = await testApp.handle(new Request(`${BASE_URL}/`));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("A API Elysia + Drizzle está online!");
  });
});
