import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage";

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
});