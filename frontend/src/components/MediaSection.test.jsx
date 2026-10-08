import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MediaSection from "./MediaSection";

describe("MediaSection", () => {
  it("renders the section title and child content", () => {
    render(
      <MediaSection title="Recently Played">
        <p>Test media item</p>
      </MediaSection>
    );

    expect(
      screen.getByText("Recently Played")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Test media item")
    ).toBeInTheDocument();
  });
});