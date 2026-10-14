import { useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { login, type AuthUser } from "../../lib/api";

export function LoginPage({
  authUser,
  isCheckingSession,
  onAuthenticated,
  onSignOut,
}: {
  authUser: AuthUser | null;
  isCheckingSession: boolean;
  onAuthenticated: (token: string, user: AuthUser) => void;
  onSignOut: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(email, password);
      onAuthenticated(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page login-page">
      <AppHeader authUser={authUser} onSignOut={onSignOut} />
      <main className="login-main">
        <section className="login-panel" aria-labelledby="login-heading">
          {isCheckingSession ? (
            <p className="status-message">Checking session...</p>
          ) : null}
          <div className="heading-group">
            <p className="eyebrow">Luna dealer portal</p>
            <h1 id="login-heading">Sign in to Luna</h1>
            <p className="panel-copy">
              Access inventory, customer activity, and quote workflows from
              your Luna account.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="name@dealer.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <a className="forgot-link" href="/">
              Forgot password?
            </a>
            {error ? <p className="form-error">{error}</p> : null}
            <button
              className="button button-primary full-width"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
