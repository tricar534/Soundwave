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
