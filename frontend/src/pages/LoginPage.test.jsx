import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

describe("SW-237 LoginPage", () => {
  it("renders a labeled email-or-username field and masked password field", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email or username" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows required-field errors without submitting empty values", () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Enter your email or username.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only identifiers", () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Email or username" }), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Enter your email or username.")).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("passes validated input to a provided callback without logging in locally", () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Email or username" }), {
      target: { value: "  listener@example.test  " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith({
      identifier: "listener@example.test",
      password: "synthetic-password",
    });
  });

  it("does not claim success when the backend API is not connected", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByRole("textbox", { name: "Email or username" }), {
      target: { value: "listener" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("status")).toHaveTextContent("Authentication API integration is coming");
  });
});
