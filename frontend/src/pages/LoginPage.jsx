import { useState } from "react";
import PageHeader from "../components/PageHeader";
import "../styles/login.css";

/**
 * SW-237: UI-only login form.
 * A later frontend task can provide onLogin to connect the backend authentication API.
 * This component does not authenticate users or save passwords/tokens.
 */
function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setNotice("");

    const nextErrors = {};
    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your email or username.";
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (onLogin) {
      onLogin({ identifier: identifier.trim(), password });
      return;
    }

    // Do not pretend that a UI-only submission successfully authenticated.
    setNotice("Login form ready. Authentication API integration is coming in a later task.");
  }

  return (
    <section className="page login-page" aria-labelledby="login-heading">
      <PageHeader
        title={<span id="login-heading">Sign in</span>}
        description="Enter your Soundwave account details."
      />

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
            />
            {errors.password && (
              <p className="login-error" id="login-password-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <button className="login-submit" type="submit">Sign in</button>
        </form>
        {notice && <p className="login-notice" role="status">{notice}</p>}
      </div>
    </section>
  );
}

export default LoginPage;
