import { useEffect, type ReactNode } from "react";
import { Link } from "../../components/Link";
import type { AuthUser } from "../../lib/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "products", label: "Products", href: "/admin/products" },
  { id: "quotes", label: "Quotes", href: "/admin/quotes" },
  { id: "users", label: "Users", href: "/admin/users" },
] as const;

export function AdminLayout({
  user,
  isCheckingSession,
  onSignOut,
  activeSection,
  children,
}: {
  user: AuthUser | null;
  isCheckingSession: boolean;
  onSignOut: () => void;
  activeSection: "dashboard" | "products" | "quotes" | "users";
  children: ReactNode;
}) {
  const isAuthorized = Boolean(user && user.role === "admin");

  useEffect(() => {
    if (!isCheckingSession && !isAuthorized) {
      window.location.href = "/login";
    }
  }, [isCheckingSession, isAuthorized]);

  return (
    <div className="page admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <Link className="admin-sidebar-brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>Luna</span>
          </Link>

          <nav className="admin-sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                className={`admin-sidebar-link${
                  activeSection === item.id ? " is-active" : ""
                }`}
                to={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            {user ? <p className="admin-sidebar-user">{user.email}</p> : null}
            <button className="admin-sidebar-signout" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="admin-content">
          {isCheckingSession || !isAuthorized ? (
            <section className="dashboard-panel">
              <p className="status-message">Loading...</p>
            </section>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
