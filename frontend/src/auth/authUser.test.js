import { describe, expect, it } from "vitest";
import { extractAuthenticatedUser } from "./authUser";
import { LoginRequestError } from "../services/api";

describe("Sprint 4 Task 3 - authenticated UI identity", () => {
  it("extracts only the ID and display name, not tokens or passwords", () => {
    const user = extractAuthenticatedUser({
      user: { id: "listener-1", username: "listener", role: "admin", password: "DO_NOT_STORE" },
      token: "DO_NOT_STORE",
    });
    expect(user).toEqual({ id: "listener-1", displayName: "listener" });
    expect(JSON.stringify(user)).not.toContain("DO_NOT_STORE");
  });

  it("accepts an ID-only user with a safe fallback name", () => {
    expect(extractAuthenticatedUser({ user: { id: 42 } }))
      .toEqual({ id: 42, displayName: "Soundwave listener" });
  });

  it("prefers a trimmed display name when supplied", () => {
    expect(extractAuthenticatedUser({ user: { id: "42", displayName: "  Alice  ", email: "alice@example.test" } }))
      .toEqual({ id: "42", displayName: "Alice" });
  });

  it.each([null, {}, { user: null }, { user: {} }, { user: { id: "  " } }, { user: [] }, { user: { id: Infinity } }])(
    "rejects a response lacking a valid user identity: %j",
    (response) => {
      expect(() => extractAuthenticatedUser(response)).toThrow(LoginRequestError);
      expect(() => extractAuthenticatedUser(response)).toThrow("invalid user response");
    },
  );
});
