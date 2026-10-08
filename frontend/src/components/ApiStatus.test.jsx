import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApiStatus from "./ApiStatus";
import * as api from "../services/api";
import {
  mockHealth,
  silenceConsoleError,
} from "../test/apiMocks";

vi.mock("../services/api");

describe("ApiStatus", () => {
  it("shows checking while the health request is pending", () => {
    mockHealth.success();

    render(<ApiStatus />);

    expect(
      screen.getByText("Backend: Checking...")
    ).toBeInTheDocument();
  });

  it("shows connected when the backend health check succeeds", async () => {
    mockHealth.success();

    render(<ApiStatus />);

    expect(
      await screen.findByText("Backend: Connected")
    ).toBeInTheDocument();
    expect(api.getHealth).toHaveBeenCalledTimes(1);
  });

  it("shows unavailable when health returns a non-ok status", async () => {
    mockHealth.success({ status: "degraded" });

    render(<ApiStatus />);

    expect(
      await screen.findByText("Backend: Unavailable")
    ).toBeInTheDocument();
  });

  it("shows unavailable on an HTTP 500 response", async () => {
    const consoleError = silenceConsoleError();
    mockHealth.httpError(500);

    render(<ApiStatus />);

    expect(
      await screen.findByText("Backend: Unavailable")
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("shows unavailable on a network failure", async () => {
    const consoleError = silenceConsoleError();
    mockHealth.networkFailure();

    render(<ApiStatus />);

    expect(
      await screen.findByText("Backend: Unavailable")
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
