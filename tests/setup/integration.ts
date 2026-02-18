import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { server } from "../integration/msw/server";
import { resetMswFixtures } from "../integration/msw/handlers";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMswFixtures());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
