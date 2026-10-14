import { useEffect, useState } from "react";
import { Link } from "../../components/Link";
import { fetchAdminProducts, fetchAdminQuotes, fetchUsers } from "../../lib/api";

export function AdminOverviewPage({ token }: { token: string }) {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [quoteCount, setQuoteCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [products, users, quotes] = await Promise.all([
          fetchAdminProducts(token),
          fetchUsers(token),
          fetchAdminQuotes(token),
        ]);
        if (isMounted) {
          setProductCount(products.length);
          setUserCount(users.length);
          setQuoteCount(quotes.length);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard stats");
        }
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <section className="admin-overview">
      <div>
        <p className="eyebrow">Overview</p>
        <h2>Welcome back</h2>
        <p className="panel-copy">
          Manage the product catalog, quote requests, and dealer portal access
          from here.
        </p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-stat-grid">
        <Link className="dashboard-panel admin-stat-card" to="/admin/products">
          <span className="eyebrow">Products</span>
          <strong>{productCount ?? "-"}</strong>
          <span className="panel-copy">Manage catalog, sizes, and add-ons</span>
        </Link>
        <Link className="dashboard-panel admin-stat-card" to="/admin/quotes">
          <span className="eyebrow">Quotes</span>
          <strong>{quoteCount ?? "-"}</strong>
          <span className="panel-copy">Review quote requests from the storefront</span>
        </Link>
        <Link className="dashboard-panel admin-stat-card" to="/admin/users">
          <span className="eyebrow">Users</span>
          <strong>{userCount ?? "-"}</strong>
          <span className="panel-copy">Manage dealer portal access</span>
        </Link>
      </div>
    </section>
  );
}
