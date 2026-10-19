import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

// SW-220: Verify Home page search submission and input state handling.
// Tests confirm that search queries are passed to App and that saved
// input values can be restored when returning to Home.

describe("HomePage", () => {
  it("renders the Home page header", () => {
    render(<HomePage />);

    expect(
      screen.getByText("Home")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Welcome back to Soundwave.")
    ).toBeInTheDocument();
  });

  it("renders the Recently Played section", () => {
    render(<HomePage />);

    expect(
      screen.getByText("Recently Played")
    ).toBeInTheDocument();
  });

  it("renders recently played media cards", () => {
    render(<HomePage />);

    expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
    expect(screen.getByText("Chill Waves")).toBeInTheDocument();
    expect(screen.getByText("Focus Mode")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("searchbox", {
        name: "Search music",
      })
    ).toBeInTheDocument();
  });

  // SW-220: Verify that submitting a Home search passes the query to App.
  it("submits the Home search query", () => {
    const onOpenSearch = vi.fn();
    const onHomeQueryChange = vi.fn();

    // Render Home with callbacks that simulate App state management.
    const { rerender } = render(
      <HomePage
        homeQuery=""
        onHomeQueryChange={onHomeQueryChange}
        onOpenSearch={onOpenSearch}
      />
    );

    const searchInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    // Simulate the user entering a search query.
    fireEvent.change(searchInput, {
      target: { value: "Signal" },
    });

    // Confirm that Home reports the updated query to App.
    expect(onHomeQueryChange).toHaveBeenCalledWith("Signal");

    // Simulate App passing the updated state back to Home.
    rerender(
      <HomePage
        homeQuery="Signal"
        onHomeQueryChange={onHomeQueryChange}
        onOpenSearch={onOpenSearch}
      />
    );

    // Submit the search form to trigger the navigation callback.
    fireEvent.submit(searchInput.closest("form"));

    // Confirm that App receives the correct search query.
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
    expect(onOpenSearch).toHaveBeenCalledWith("Signal");
  });

  // SW-220: Verify that Home can display a previously saved search draft.
  it("displays the Home search query provided by App", () => {
    render(
      <HomePage
        homeQuery="Unfinished Search"
        onHomeQueryChange={vi.fn()}
        onOpenSearch={vi.fn()}
      />
    );

    // Confirm that the input displays the query provided by App.
    // This supports preserving unfinished searches across navigation.
    expect(
      screen.getByRole("searchbox", { name: "Search music" })
    ).toHaveValue("Unfinished Search");
  });

});