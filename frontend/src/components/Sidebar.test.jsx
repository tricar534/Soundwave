import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

vi.mock("./ApiStatus", () => ({
  default: () => <span>Backend: Connected</span>,
}));

describe("Sidebar", () => {
  it("renders the navigation items", () => {
    render(
      <Sidebar
        currentPage="home"
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("exposes the main navigation landmark by role and accessible name", () => {
    render(
      <Sidebar
        currentPage="home"
        onNavigate={() => {}}
      />
    );

    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
  });

  it("marks the current page as active", () => {
    render(
      <Sidebar
        currentPage="search"
        onNavigate={() => {}}
      />
    );

    const searchButton = screen.getByRole("button", {
      name: "Search",
    });

    expect(searchButton).toHaveClass("active");
    expect(searchButton).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("calls onNavigate with the selected page", () => {
    const onNavigate = vi.fn();

    render(
      <Sidebar
        currentPage="home"
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Library",
      })
    );

    expect(onNavigate).toHaveBeenCalledWith("library");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("Sprint 4 Task 3 - sidebar authentication display", () => {
  it("shows Sign in when no user is authenticated", () => {
    render(<Sidebar currentPage="home" onNavigate={() => {}} />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("shows the account label and dispatches local logout", () => {
    const onLogout = vi.fn();
    render(
      <Sidebar
        currentPage="home"
        onNavigate={() => {}}
        authenticatedUser={{ id: "u-123", displayName: "Alice" }}
        onLogout={onLogout}
      />,
    );
    expect(screen.getByText("Signed in as Alice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});


// Independent regression task: account presentation and UI state transitions.
describe("Sprint 4 - sidebar authentication regression coverage", () => {
  it("marks the sign-in destination as the current page for keyboard and screen-reader navigation", () => {
    const onNavigate = vi.fn();
    render(<Sidebar currentPage="login" onNavigate={onNavigate} />);
    const signIn = screen.getByRole("button", { name: "Sign in" });
    expect(signIn).toHaveClass("active");
    expect(signIn).toHaveAttribute("aria-current", "page");
    fireEvent.click(signIn);
    expect(onNavigate).toHaveBeenCalledWith("login");
  });

  it("switches cleanly between signed-out, signed-in, and signed-out views on rerender", () => {
    const onNavigate = vi.fn();
    const onLogout = vi.fn();
    const { rerender } = render(<Sidebar currentPage="home" onNavigate={onNavigate} onLogout={onLogout} />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();

    rerender(
      <Sidebar
        currentPage="library"
        onNavigate={onNavigate}
        onLogout={onLogout}
        authenticatedUser={{ id: "u-321", displayName: "Alice" }}
      />,
    );
    expect(screen.getByText("Signed in as Alice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Library" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);

    rerender(<Sidebar currentPage="login" onNavigate={onNavigate} onLogout={onLogout} />);
    expect(screen.queryByText("Signed in as Alice")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("renders untrusted account display names as text instead of HTML", () => {
    const untrustedName = '<img src=x onerror=alert(1)>';
    render(
      <Sidebar
        currentPage="home"
        onNavigate={() => {}}
        authenticatedUser={{ id: "u-321", displayName: untrustedName }}
      />,
    );
    expect(screen.getByText(`Signed in as ${untrustedName}`)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
