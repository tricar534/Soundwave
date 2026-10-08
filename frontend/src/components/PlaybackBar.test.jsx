import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlaybackBar from "./PlaybackBar";

describe("PlaybackBar", () => {
  it("renders the default track information", () => {
    render(<PlaybackBar />);

    expect(
      screen.getByText("No track selected")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Soundwave")
    ).toBeInTheDocument();
  });

  it("renders playback controls and volume input", () => {
    render(<PlaybackBar />);

    expect(
      screen.getByRole("button", { name: "Previous track" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Play" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Next track" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Volume")
    ).toBeInTheDocument();
  });

  it("toggles between Play and Pause when clicked", () => {
    render(<PlaybackBar />);

    const playButton = screen.getByRole("button", {
      name: "Play",
    });

    fireEvent.click(playButton);

    expect(
      screen.getByRole("button", { name: "Pause" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Pause" })
    );

    expect(
      screen.getByRole("button", { name: "Play" })
    ).toBeInTheDocument();
  });
});