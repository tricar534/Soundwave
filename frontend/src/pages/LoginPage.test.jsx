import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import { LoginRequestError } from "../services/api";

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


describe("Sprint 4 Task 2 - login API interaction", () => {
  function fillForm() {
    fireEvent.change(screen.getByRole("textbox", { name: "Email or username" }), {
      target: { value: "listener" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-only" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  }

  it("shows a pending state and prevents double submission", async () => {
    let resolveLogin;
    const onLogin = vi.fn(() => new Promise((resolve) => { resolveLogin = resolve; }));
    render(<LoginPage onLogin={onLogin} />);
    fillForm();

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(onLogin).toHaveBeenCalledTimes(1);

    resolveLogin({ user: { id: "test-user" } });
    expect(await screen.findByRole("status")).toHaveTextContent("Sign-in successful");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("displays a safe authentication error and clears the password", async () => {
    const onLogin = vi.fn().mockRejectedValue(
      new LoginRequestError("Incorrect email/username or password.", 401),
    );
    render(<LoginPage onLogin={onLogin} />);
    fillForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email/username or password.");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("does not display unexpected internal errors", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("private internal detail"));
    render(<LoginPage onLogin={onLogin} />);
    fillForm();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Sign-in unavailable");
    });
    expect(screen.queryByText(/private internal detail/i)).not.toBeInTheDocument();
  });
});


describe("Sprint 4 Task 4 - access notices and safe retry behavior", () => {
  function fillAndSubmit() {
    fireEvent.change(screen.getByRole("textbox", { name: "Email or username" }), {
      target: { value: "listener" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-only" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  }

  it("provides a clear, accessible reason for requiring sign-in", () => {
    render(<LoginPage onLogin={vi.fn()} accessMessage="Sign in to access your Library." />);
    expect(screen.getByRole("status")).toHaveTextContent("Sign in to access your Library.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears an outdated authentication error when inputs are edited", async () => {
    const onLogin = vi.fn().mockRejectedValue(new LoginRequestError("Incorrect email/username or password.", 401));
    render(<LoginPage onLogin={onLogin} />);
    fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email/username or password.");
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "corrected-password" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("allows retry after a failed login without keeping the old error", async () => {
    const onLogin = vi.fn()
      .mockRejectedValueOnce(new LoginRequestError("Incorrect email/username or password.", 401))
      .mockResolvedValueOnce({ user: { id: "u-123" } });
    render(<LoginPage onLogin={onLogin} />);
    fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email/username or password.");
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "second-attempt" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Sign-in successful.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onLogin).toHaveBeenCalledTimes(2);
  });
});
