import { LoginRequestError } from "../services/api";

/**
 * Extract the only frontend identity fields we need from a successful login.
 * Backend response contract (user.id) must be confirmed with the backend owner.
 * Never store the password, token, or original response in UI state.
 */
export function extractAuthenticatedUser(response) {
  const user = response?.user;
  const idIsValid = (
    (typeof user?.id === "string" && user.id.trim().length > 0)
    || (typeof user?.id === "number" && Number.isFinite(user.id))
  );

  if (!user || typeof user !== "object" || Array.isArray(user) || !idIsValid) {
    throw new LoginRequestError("The authentication server returned an invalid user response.");
  }

  const displayName = [user.displayName, user.username, user.name, user.email]
    .find((value) => typeof value === "string" && value.trim().length > 0);

  return {
    id: user.id,
    displayName: displayName ? displayName.trim() : "Soundwave listener",
  };
}
