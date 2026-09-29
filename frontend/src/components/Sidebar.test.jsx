import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

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