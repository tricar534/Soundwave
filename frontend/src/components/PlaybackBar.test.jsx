import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlaybackBar from "./PlaybackBar";
import App from "../App";

// SW-221: Verify existing PlaybackBar controls and state behavior.
// Artwork update: Verify selected-track artwork and placeholder behavior.
//
// Current scope includes track information, artwork, local play/pause state,
// volume controls, and persistence during navigation.
// Actual audio playback and track skipping are not implemented yet.

function getPlaybackBar() {
  // <footer> has the implicit ARIA role "contentinfo".
  return screen.getByRole("contentinfo");
}

const sampleTrack = {
  id: "1",
  title: "Midnight Drive",
  subtitle: "Example Artist",
};

const otherTrack = {
  id: "2",
  title: "Chill Waves",
  subtitle: "Soundwave Mix",
};

describe("PlaybackBar", () => {
  describe("initial render (no track selected)", () => {
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

  describe("selected track artwork", () => {
    // Verify that selecting a track displays its associated artwork.
    it("displays artwork when a track is selected", () => {
      const selectedTrack = {
        id: "50",
        title: "Midnight Drive",
        subtitle: "Soundwave",
        image: "/images/lofi.jpeg",
        type: "Song",
      };

      render(<PlaybackBar currentTrack={selectedTrack} />);

      // Verify the selected track information.
      expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
      expect(screen.getByText("Soundwave")).toBeInTheDocument();

      // Verify the artwork uses the selected track's image.
      const artwork = screen.getByRole("img", {
        name: "Midnight Drive artwork",
      });

      expect(artwork).toHaveAttribute(
        "src",
        "/images/lofi.jpeg"
      );

      // Ensure artwork stays inside the fixed-size placeholder.
      const placeholder = getPlaybackBar().querySelector(
        ".track-placeholder"
      );

      expect(placeholder).toContainElement(artwork);
    });

    // Verify that changing tracks updates both artwork and track details.
    it("updates artwork when a different track is selected", () => {
      const firstTrack = {
        id: "50",
        title: "Midnight Drive",
        subtitle: "Soundwave",
        image: "/images/lofi.jpeg",
        type: "Song",
      };

      const secondTrack = {
        id: "52",
        title: "Neon Sky",
        subtitle: "Soundwave",
        image: "/images/city-light.jpeg",
        type: "Song",
      };

      // Render PlaybackBar with the first track.
      const { rerender } = render(
        <PlaybackBar currentTrack={firstTrack} />
      );

      expect(
        screen.getByRole("img", {
          name: "Midnight Drive artwork",
        })
      ).toHaveAttribute("src", "/images/lofi.jpeg");

      // Simulate App selecting a different track.
      rerender(<PlaybackBar currentTrack={secondTrack} />);

      // Verify that the title and artwork update.
      expect(screen.getByText("Neon Sky")).toBeInTheDocument();

      expect(
        screen.getByRole("img", {
          name: "Neon Sky artwork",
        })
      ).toHaveAttribute("src", "/images/city-light.jpeg");

      // The previous track's artwork should no longer appear.
      expect(
        screen.queryByRole("img", {
          name: "Midnight Drive artwork",
        })
      ).not.toBeInTheDocument();
    });

    // Verify that the placeholder remains when artwork is unavailable.
    it("keeps the placeholder when no artwork is provided", () => {
      // No track selected.
      const { rerender } = render(<PlaybackBar />);

      expect(
        screen.getByText("No track selected")
      ).toBeInTheDocument();

      expect(
        screen.queryByRole("img")
      ).not.toBeInTheDocument();

      expect(
        getPlaybackBar().querySelector(".track-placeholder")
      ).toBeInTheDocument();

      // A selected track without an image should also use the placeholder.
      rerender(
        <PlaybackBar
          currentTrack={{
            id: "53",
            title: "Quiet Orbit",
            subtitle: "Soundwave",
            type: "Song",
          }}
        />
      );

      expect(screen.getByText("Quiet Orbit")).toBeInTheDocument();

      expect(
        screen.queryByRole("img")
      ).not.toBeInTheDocument();

      expect(
        getPlaybackBar().querySelector(".track-placeholder")
      ).toBeInTheDocument();
    });
  });


  });

  describe("play / pause interaction", () => {
    it("switches to Pause after one click", () => {
      render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));

      const pause = screen.getByRole("button", { name: "Pause" });
      expect(pause).toHaveTextContent("Pause");
      expect(
        screen.queryByRole("button", { name: "Play" })
      ).not.toBeInTheDocument();
    });

    it("returns to Play after a second click", () => {
      render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));

      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    it("stays consistent across repeated toggles", () => {
      render(<PlaybackBar currentTrack={sampleTrack} />);

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
      render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));

      expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
      expect(screen.getByText("Example Artist")).toBeInTheDocument();
    });
  });

  describe("track change resets play state", () => {
    it("resets to paused when a different track is selected", () => {
      const { rerender } = render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      expect(
        screen.getByRole("button", { name: "Pause" })
      ).toBeInTheDocument();

      rerender(<PlaybackBar currentTrack={otherTrack} />);

      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Pause" })
      ).not.toBeInTheDocument();
    });

    it("resets to paused and disables Play when the track is cleared", () => {
      const { rerender } = render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      expect(
        screen.getByRole("button", { name: "Pause" })
      ).toBeInTheDocument();

      rerender(<PlaybackBar currentTrack={null} />);

      expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    });
  });

  describe("previous / next controls", () => {
    it("can be clicked without changing track info or play state", () => {
      render(<PlaybackBar currentTrack={sampleTrack} />);

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
      fireEvent.click(screen.getByRole("button", { name: "Next track" }));

      // No queue exists yet, so prev/next are no-ops in the current build.
      expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
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
      render(<PlaybackBar currentTrack={sampleTrack} />);

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

      // Select a Song so the Play control is enabled.
      fireEvent.click(screen.getByText("Midnight Drive"));

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
