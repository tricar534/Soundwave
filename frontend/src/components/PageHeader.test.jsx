import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title and description", () => {
    render(
      <PageHeader
        title="Home"
        description="Welcome back to Soundwave."
      />
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(
      screen.getByText("Welcome back to Soundwave.")
    ).toBeInTheDocument();
  });

  it("renders child content when provided", () => {
    render(
      <PageHeader title="Search">
        <button>Test Action</button>
      </PageHeader>
    );

    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Test Action")).toBeInTheDocument();
  });
});