import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MediaSection from "./MediaSection";
import MediaCard from "./MediaCard";

// SW-95: MediaSection populated vs. empty content-state tests.

const items = [
  { id: 1, title: "Midnight Drive", subtitle: "Example Artist", type: "Song" },
  { id: 2, title: "Chill Waves", subtitle: "Soundwave Mix", type: "Playlist" },
  { id: 3, title: "Focus Mode", subtitle: "Study Playlist", type: "Playlist" },
];

function getSection(title) {
  // <section> without an accessible name has no "region" role,
  // so locate it through its heading.
  return screen.getByRole("heading", { level: 2, name: title }).closest("section");
}

describe("MediaSection", () => {
  describe("populated content", () => {
    it("renders the section title and child content", () => {
      render(
        <MediaSection title="Recently Played">
          <p>Test media item</p>
        </MediaSection>
      );

      expect(screen.getByText("Recently Played")).toBeInTheDocument();
      expect(screen.getByText("Test media item")).toBeInTheDocument();
    });

    it("renders the title as a level-2 heading", () => {
      render(
        <MediaSection title="Recommended">
          <p>Item</p>
        </MediaSection>
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "Recommended" })
      ).toBeInTheDocument();
    });

    it("renders every MediaCard inside the section grid, in order", () => {
      render(
        <MediaSection title="Recently Played">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              image="/images/x.jpg"
              type={item.type}
            />
          ))}
        </MediaSection>
      );

      const section = getSection("Recently Played");
      const grid = section.querySelector(".media-grid");
      const cardTitles = within(grid)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent);

      expect(grid.children).toHaveLength(3);
      expect(cardTitles).toEqual(["Midnight Drive", "Chill Waves", "Focus Mode"]);
    });

    it("keeps content scoped to its own section when several are rendered", () => {
      render(
        <>
          <MediaSection title="Recently Played">
            <MediaCard title="Midnight Drive" image="/a.jpg" type="Song" />
          </MediaSection>
          <MediaSection title="Made for You">
            <MediaCard title="Daily Mix" image="/b.jpg" type="Playlist" />
          </MediaSection>
        </>
      );

      const recent = getSection("Recently Played");
      const madeForYou = getSection("Made for You");

      expect(within(recent).getByText("Midnight Drive")).toBeInTheDocument();
      expect(within(recent).queryByText("Daily Mix")).not.toBeInTheDocument();
      expect(within(madeForYou).getByText("Daily Mix")).toBeInTheDocument();
      expect(within(madeForYou).queryByText("Midnight Drive")).not.toBeInTheDocument();
    });
  });

  describe("empty / no-content condition", () => {
    it("still renders the heading with an empty grid when given no children", () => {
      render(<MediaSection title="Recently Played" />);

      const section = getSection("Recently Played");

      expect(section).toBeInTheDocument();
      expect(section.querySelector(".media-grid")).toBeEmptyDOMElement();
    });

    it("renders no cards when mapped over an empty list", () => {
      const emptyList = [];

      render(
        <MediaSection title="Recommended">
          {emptyList.map((item) => (
            <MediaCard key={item.id} title={item.title} image="" type="" />
          ))}
        </MediaSection>
      );

      const section = getSection("Recommended");

      expect(within(section).queryAllByRole("img")).toHaveLength(0);
      expect(
        within(section).queryAllByRole("heading", { level: 3 })
      ).toHaveLength(0);
      expect(section.querySelector(".media-grid")).toBeEmptyDOMElement();
    });
  });
});
