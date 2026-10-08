import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();

  // SW-96: reset mock state between tests so one test's
  // mockResolvedValue / mockRejectedValue never leaks into the next.
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
