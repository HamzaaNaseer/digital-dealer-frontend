import type { AuthUser } from "../lib/api";

export function AppHeader({
  authUser,
  onSignOut,
}: {
  authUser: AuthUser | null;
  onSignOut: () => void;
}) {
  return (
    <header className="app-header">
      <a className="brand" href="/">
        <span className="brand-mark" aria-hidden="true" />
        <span>Luna</span>
      </a>
      <nav aria-label="Primary navigation">
        {authUser ? (
          <>
            <a href="/products">Product Finder</a>
            {authUser.role === "admin" ? <a href="/admin/products">Admin</a> : null}
            <button className="nav-button" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <a href="/">Home</a>
            <a href="/login">Login</a>
          </>
        )}
      </nav>
    </header>
  );
}
