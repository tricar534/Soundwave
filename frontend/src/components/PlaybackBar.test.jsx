import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlaybackBar from "./PlaybackBar";
import App from "../App";

// SW-94: PlaybackBar control and state tests.
// Scope: only behavior the current PlaybackBar implements
// (static placeholder track, local play/pause toggle,
// non-functional previous/next buttons, uncontrolled volume slider).
// Real track selection and streaming are out of scope (SW-116 / SW-117).

function getPlaybackBar() {
  // <footer> has the implicit ARIA role "contentinfo".
  return screen.getByRole("contentinfo");
}

describe("PlaybackBar", () => {
  describe("initial render", () => {
    it("renders the default track information", () => {
      render(<PlaybackBar />);

      expect(screen.getByText("No track selected")).toBeInTheDocument();
      expect(screen.getByText("Soundwave")).toBeInTheDocument();
    });

    it("renders previous, play and next controls", () => {
      render(<PlaybackBar />);

      expect(
        screen.getByRole("button", { name: "Previous track" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Next track" })
      ).toBeInTheDocument();
    });

    it("starts in the paused state (shows Play, not Pause)", () => {
      render(<PlaybackBar />);

      expect(screen.getByRole("button", { name: "Play" })).toHaveTextContent(
        "Play"
      );
      expect(
        screen.queryByRole("button", { name: "Pause" })
      ).not.toBeInTheDocument();
    });

    it("renders a labelled volume slider with range 0-100 defaulting to 70", () => {
      render(<PlaybackBar />);

      const volume = screen.getByRole("slider", { name: "Volume" });

      expect(volume).toHaveAttribute("min", "0");
      expect(volume).toHaveAttribute("max", "100");
      expect(volume).toHaveValue("70");
    });

    it("uses type=button on every control so they never submit a form", () => {
      render(<PlaybackBar />);

      screen.getAllByRole("button").forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("play / pause interaction", () => {
    it("switches to Pause after one click", () => {
      render(<PlaybackBar />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));

      const pause = screen.getByRole("button", { name: "Pause" });
      expect(pause).toHaveTextContent("Pause");
      expect(
        screen.queryByRole("button", { name: "Play" })
      ).not.toBeInTheDocument();
    });

    it("returns to Play after a second click", () => {
      render(<PlaybackBar />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));

      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    it("stays consistent across repeated toggles", () => {
      render(<PlaybackBar />);

      // Odd number of clicks -> playing, even -> paused.
      for (let clicks = 1; clicks <= 5; clicks += 1) {
        fireEvent.click(
          screen.getByRole("button", { name: /^(Play|Pause)$/ })
        );

        const expected = clicks % 2 === 1 ? "Pause" : "Play";
        expect(
          screen.getByRole("button", { name: expected })
        ).toHaveTextContent(expected);
      }
    });

    it("does not change the displayed track when toggling", () => {
      render(<PlaybackBar />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));

      expect(screen.getByText("No track selected")).toBeInTheDocument();
      expect(screen.getByText("Soundwave")).toBeInTheDocument();
    });
  });

  describe("previous / next controls", () => {
    it("can be clicked without changing track info or play state", () => {
      render(<PlaybackBar />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
      fireEvent.click(screen.getByRole("button", { name: "Next track" }));

      // No queue exists yet, so prev/next are no-ops in the current build.
      expect(screen.getByText("No track selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });
  });

  describe("volume interaction", () => {
    it("updates the slider value when the user changes it", () => {
      render(<PlaybackBar />);

      const volume = screen.getByRole("slider", { name: "Volume" });

      fireEvent.change(volume, { target: { value: "25" } });
      expect(volume).toHaveValue("25");

      fireEvent.change(volume, { target: { value: "0" } });
      expect(volume).toHaveValue("0");

      fireEvent.change(volume, { target: { value: "100" } });
      expect(volume).toHaveValue("100");
    });

    it("clamps values outside 0-100 to the slider bounds", () => {
      render(<PlaybackBar />);

      const volume = screen.getByRole("slider", { name: "Volume" });

      fireEvent.change(volume, { target: { value: "150" } });
      expect(volume).toHaveValue("100");

      fireEvent.change(volume, { target: { value: "-10" } });
      expect(volume).toHaveValue("0");
    });

    it("does not affect play state when volume changes", () => {
      render(<PlaybackBar />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
        target: { value: "40" },
      });

      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });
  });

  describe("persistence during page navigation (inside App)", () => {
    const pages = ["Search", "Library", "Home"];

    it("stays rendered on every page", () => {
      render(<App />);

      expect(getPlaybackBar()).toBeInTheDocument();

      pages.forEach((page) => {
        fireEvent.click(screen.getByRole("button", { name: page }));

        expect(
          screen.getByRole("button", { name: page })
        ).toHaveAttribute("aria-current", "page");
        expect(getPlaybackBar()).toBeInTheDocument();
      });
    });

    it("keeps play state and volume when navigating between pages", () => {
      render(<App />);

      const bar = getPlaybackBar();

      fireEvent.click(within(bar).getByRole("button", { name: "Play" }));
      fireEvent.change(within(bar).getByRole("slider", { name: "Volume" }), {
        target: { value: "30" },
      });

      pages.forEach((page) => {
        fireEvent.click(screen.getByRole("button", { name: page }));

        // Same DOM node => PlaybackBar was not unmounted/remounted.
        expect(getPlaybackBar()).toBe(bar);
        expect(
          within(bar).getByRole("button", { name: "Pause" })
        ).toBeInTheDocument();
        expect(
          within(bar).getByRole("slider", { name: "Volume" })
        ).toHaveValue("30");
      });
    });
  });
});
