
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./services/api";
import { mockTracks } from "./test/apiMocks";

// SW-220: Mock API responses so navigation tests do not
// require a running backend or PostgreSQL database.
vi.mock("./services/api");

beforeEach(() => {
  mockTracks.success();
  vi.mocked(api.getHealth).mockResolvedValue({ status: "ok" });
});

describe("App search navigation", () => {
  // SW-220: Verify unfinished Home searches survive navigation.
  it("preserves Home search input after visiting Library", () => {
    render(<App />);

    const homeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    // Type without submitting the search.
    fireEvent.change(homeInput, {
      target: { value: "hello" },
    });

    // Leave Home and return.
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    // App should restore the unfinished search draft.
    expect(
      screen.getByRole("searchbox", { name: "Search music" })
    ).toHaveValue("hello");
  });

  // SW-220: Verify query submission and Search input persistence.
  it("submits Home search and preserves Search input", async () => {
    render(<App />);

    const homeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    // Enter a query on Home and submit it.
    fireEvent.change(homeInput, {
      target: { value: "Real" },
    });

    fireEvent.submit(homeInput.closest("form"));

    // Search opens with the submitted query.
    const searchInput = screen.getByPlaceholderText("Search Soundwave");
    expect(searchInput).toHaveValue("Real");

    // The matching backend fixture track should appear.
    expect(await screen.findByText("Real Track")).toBeInTheDocument();

    // Edit the query directly on Search.
    fireEvent.change(searchInput, {
      target: { value: "unknown" },
    });

    expect(
      screen.getByText("No songs, artists, or playlists found.")
    ).toBeInTheDocument();

    // Navigate away from Search and return.
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    // The edited Search query should be preserved.
    expect(
      screen.getByPlaceholderText("Search Soundwave")
    ).toHaveValue("unknown");

    // Submitting another Home query should replace it.
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    const restoredHomeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    fireEvent.change(restoredHomeInput, {
      target: { value: "Real" },
    });

    fireEvent.submit(restoredHomeInput.closest("form"));

    expect(
      screen.getByPlaceholderText("Search Soundwave")
    ).toHaveValue("Real");

    expect(await screen.findByText("Real Track")).toBeInTheDocument();
  });
});


describe("Sprint 4 Task 2 - App login API wiring", () => {
  it("submits the login page to the centralized auth API service", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: { id: "test-user" } });
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const main = screen.getByRole("main");

    fireEvent.change(within(main).getByRole("textbox", { name: "Email or username" }), {
      target: { value: "listener" },
    });
    fireEvent.change(within(main).getByLabelText("Password"), {
      target: { value: "synthetic-only" },
    });
    fireEvent.click(within(main).getByRole("button", { name: "Sign in" }));

    expect(api.login).toHaveBeenCalledWith({ identifier: "listener", password: "synthetic-only" });
    expect(await screen.findByText("Signed in as Soundwave listener")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});


describe("Sprint 4 Task 3 - authentication state and UI logout", () => {
  function submitLogin() {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const main = screen.getByRole("main");
    fireEvent.change(within(main).getByRole("textbox", { name: "Email or username" }), {
      target: { value: "listener" },
    });
    fireEvent.change(within(main).getByLabelText("Password"), {
      target: { value: "synthetic-only" },
    });
    fireEvent.click(within(main).getByRole("button", { name: "Sign in" }));
  }

  it("starts signed out and signs in only after the API returns a valid user", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: { id: "u-123", name: "Alice" }, token: "private-token" });
    render(<App />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();

    submitLogin();
    expect(await screen.findByText("Signed in as Alice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("private-token");
    expect(screen.getByRole("searchbox", { name: "Search music" })).toBeInTheDocument();
  });

  it("retains the signed-in label during ordinary page navigation", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: { id: "u-123", username: "listener" } });
    render(<App />);
    submitLogin();
    expect(await screen.findByText("Signed in as listener")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    expect(screen.getByText("Signed in as listener")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByText("Signed in as listener")).toBeInTheDocument();
  });

  it("signs out locally and returns to the login page", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: { id: "u-123", name: "Alice" } });
    render(<App />);
    submitLogin();
    expect(await screen.findByText("Signed in as Alice")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.queryByText("Signed in as Alice")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("does not mark malformed successful responses as authenticated", async () => {
    vi.mocked(api.login).mockResolvedValue({ token: "not-a-user" });
    render(<App />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid user response");
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("remains signed out on API failure", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("backend details should not leak"));
    render(<App />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-in unavailable");
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it("does not persist frontend authentication state across an App remount", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: { id: "u-123", name: "Alice" } });
    const view = render(<App />);
    submitLogin();
    expect(await screen.findByText("Signed in as Alice")).toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });
});
