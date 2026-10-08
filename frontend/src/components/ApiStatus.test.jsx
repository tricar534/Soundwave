import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApiStatus from "./ApiStatus";
import * as api from "../services/api";

vi.mock("../services/api");

describe("ApiStatus", () => {
  it("shows connected when the backend health check succeeds", async () => {
    api.getHealth.mockResolvedValue({
      status: "ok",
      service: "soundwave-backend",
    });

    render(<ApiStatus />);

    expect(
      screen.getByText("Backend: Checking...")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Backend: Connected")
      ).toBeInTheDocument();
    });
  });

  it("shows unavailable when the backend health check fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    api.getHealth.mockRejectedValue(
      new Error("Connection failed")
    );

    render(<ApiStatus />);

    await waitFor(() => {
      expect(
        screen.getByText("Backend: Unavailable")
      ).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});