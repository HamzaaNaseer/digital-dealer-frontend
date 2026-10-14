import { useEffect, useState } from "react";
import { Link } from "../../components/Link";
import { deleteAdminProduct, fetchAdminProducts, type AdminProduct } from "../../lib/api";

const SEARCH_DEBOUNCE_MS = 300;

export function ProductsPage({ token }: { token: string }) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadProducts() {
      try {
        const response = await fetchAdminProducts(token, debouncedSearch || undefined);
        if (isMounted) {
          setProducts(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load products");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [token, debouncedSearch]);

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(product.id);

    try {
      await deleteAdminProduct(token, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Products</h2>
        </div>
        <Link className="button button-primary" to="/admin/products/new">
          Add product
        </Link>
      </div>

      <label className="product-search admin-products-search">
        <input
          type="search"
          placeholder="Search products..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Search products"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <p className="status-message">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="dashboard-panel product-empty-state">
          <p className="eyebrow">Catalog</p>
          <h2>No products found</h2>
          <p className="panel-copy">Try a different search, or add a new product.</p>
        </div>
      ) : (
        <div className="dashboard-panel admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Sizes</th>
                <th>Status</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.category?.name ?? "-"}</td>
                  <td>{product.subcategory?.name ?? "-"}</td>
                  <td>{product.variants.length}</td>
                  <td>
                    <span
                      className={`role-pill${product.isActive ? "" : " is-inactive"}`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="admin-products-actions">
                    <Link
                      className="button button-secondary"
                      to={`/admin/products/edit?id=${product.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      className="button button-secondary"
                      type="button"
                      disabled={deletingId === product.id}
                      onClick={() => void handleDelete(product)}
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
