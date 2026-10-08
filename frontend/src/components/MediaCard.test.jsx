import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MediaCard from "./MediaCard";

// SW-95: MediaCard content-state tests.

const song = {
  title: "Midnight Drive",
  subtitle: "Example Artist",
  image: "/images/lofi.jpeg",
  type: "Song",
};

describe("MediaCard", () => {
  describe("populated metadata", () => {
    it("renders the provided media information", () => {
      render(<MediaCard {...song} />);

      expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
      expect(screen.getByText("Example Artist")).toBeInTheDocument();
      expect(screen.getByText("Song")).toBeInTheDocument();
      expect(
        screen.getByAltText("Midnight Drive Song artwork")
      ).toBeInTheDocument();
    });

    it("renders the title as a level-3 heading", () => {
      render(<MediaCard {...song} />);

      expect(
        screen.getByRole("heading", { level: 3, name: "Midnight Drive" })
      ).toBeInTheDocument();
    });

    it("uses the supplied image path as the artwork source", () => {
      render(<MediaCard {...song} />);

      expect(
        screen.getByRole("img", { name: "Midnight Drive Song artwork" })
      ).toHaveAttribute("src", "/images/lofi.jpeg");
    });

    it.each([
      ["Chill Waves", "Soundwave Mix", "Playlist"],
      ["After Hours", "Night Collective", "Album"],
    ])(
      "reflects the media type in the badge and alt text (%s / %s)",
      (title, subtitle, type) => {
        render(
          <MediaCard
            title={title}
            subtitle={subtitle}
            image="/images/x.jpg"
            type={type}
          />
        );

        expect(screen.getByText(type)).toHaveClass("media-card-type");
        expect(
          screen.getByAltText(`${title} ${type} artwork`)
        ).toBeInTheDocument();
      }
    );
  });

  describe("optional subtitle", () => {
    it("omits the subtitle paragraph when no subtitle is supplied", () => {
      const { container } = render(
        <MediaCard title="Midnight Drive" image="/images/lofi.jpeg" type="Song" />
      );

      expect(container.querySelector(".media-card-info p")).toBeNull();
      // Title and type still render without a subtitle.
      expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
      expect(screen.getByText("Song")).toBeInTheDocument();
    });

    it("omits the subtitle paragraph when the subtitle is an empty string", () => {
      const { container } = render(<MediaCard {...song} subtitle="" />);

      expect(container.querySelector(".media-card-info p")).toBeNull();
    });
  });

  describe("selection", () => {
    it("calls onSelect when the card is clicked", () => {
      const onSelect = vi.fn();

      render(<MediaCard {...song} onSelect={onSelect} />);

      fireEvent.click(screen.getByText("Midnight Drive"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("calls onSelect when the artwork is clicked", () => {
      const onSelect = vi.fn();

      render(<MediaCard {...song} onSelect={onSelect} />);

      fireEvent.click(screen.getByAltText("Midnight Drive Song artwork"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("does not throw when clicked without an onSelect handler", () => {
      render(<MediaCard {...song} />);

      expect(() =>
        fireEvent.click(screen.getByText("Midnight Drive"))
      ).not.toThrow();
    });
  });
});
