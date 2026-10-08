import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MediaCard from "./MediaCard";

describe("MediaCard", () => {
  it("renders the provided media information", () => {
    render(
      <MediaCard
        title="Midnight Drive"
        subtitle="Example Artist"
        image="/images/lofi.jpeg"
        type="Song"
      />
    );

    expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
    expect(screen.getByText("Example Artist")).toBeInTheDocument();
    expect(screen.getByText("Song")).toBeInTheDocument();

    expect(
      screen.getByAltText("Midnight Drive Song artwork")
    ).toBeInTheDocument();
  });

  it("calls onSelect when the card is clicked", () => {
    const onSelect = vi.fn();

    render(
      <MediaCard
        title="Midnight Drive"
        subtitle="Example Artist"
        image="/images/lofi.jpeg"
        type="Song"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("Midnight Drive"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});