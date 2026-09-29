import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders the provided title and message", () => {
    render(
      <EmptyState
        title="No saved music yet"
        message="Saved music will appear here."
      />
    );

    expect(
      screen.getByText("No saved music yet")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Saved music will appear here.")
    ).toBeInTheDocument();
  });
});