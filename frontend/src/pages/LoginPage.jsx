import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { LoginRequestError } from "../services/api";
import "../styles/login.css";

/**
 * SW-237 UI extended by Sprint 4 Task 2 to call the backend API.
 * The parent App owns short-lived authentication UI state and logout.
 * This component never stores passwords or authentication tokens.
 */
function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setNotice("");

    const nextErrors = {};
    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your email or username.";
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (!onLogin) {
      // Preserve the SW-237 standalone component behavior.
      setNotice("Login form ready. Authentication API integration is coming in a later task.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin({ identifier: identifier.trim(), password });
      setNotice("Sign-in successful.");
      setPassword("");
    } catch (error) {
      // Only allow messages created by our API service. Never expose raw server errors.
      setErrors({
        form: error instanceof LoginRequestError
          ? error.message
          : "Sign-in unavailable. Please try again.",
      });
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page login-page" aria-labelledby="login-heading">
      <PageHeader
        title={<span id="login-heading">Sign in</span>}
        description="Enter your Soundwave account details."
      />

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div className="login-field">
            <label htmlFor="login-identifier">Email or username</label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: "" }));
                setNotice("");
              }}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
              required
              disabled={isSubmitting}
            />
            {errors.identifier && (
              <p className="login-error" id="login-identifier-error" role="alert">
                {errors.identifier}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: "" }));
                setNotice("");
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              required
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="login-error" id="login-password-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {errors.form && <p className="login-error" role="alert">{errors.form}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {notice && <p className="login-notice" role="status">{notice}</p>}
      </div>
    </section>
  );
}

export default LoginPage;
