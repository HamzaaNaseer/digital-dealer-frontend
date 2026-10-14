import { Fragment, useEffect, useState } from "react";
import {
  fetchAdminQuote,
  fetchAdminQuotes,
  type AdminQuoteDetail,
  type AdminQuoteSummary,
} from "../../lib/api";

const SEARCH_DEBOUNCE_MS = 300;

function formatCad(value: number) {
  return value.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function QuotesPage({ token }: { token: string }) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quotes, setQuotes] = useState<AdminQuoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminQuoteDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadQuotes() {
      try {
        const response = await fetchAdminQuotes(token, debouncedSearch || undefined);
        if (isMounted) {
          setQuotes(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load quotes");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQuotes();

    return () => {
      isMounted = false;
    };
  }, [token, debouncedSearch]);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(id);
    setDetail(null);
    setIsLoadingDetail(true);

    try {
      const response = await fetchAdminQuote(token, id);
      setDetail(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load quote");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <section className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <p className="eyebrow">Sales</p>
          <h2>Quotes</h2>
        </div>
      </div>

      <label className="product-search admin-products-search">
        <input
          type="search"
          placeholder="Search by email or company..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Search quotes"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <p className="status-message">Loading quotes...</p>
      ) : quotes.length === 0 ? (
        <div className="dashboard-panel product-empty-state">
          <p className="eyebrow">Quotes</p>
          <h2>No quote requests yet</h2>
          <p className="panel-copy">
            Quote requests submitted from the storefront will show up here.
          </p>
        </div>
      ) : (
        <div className="dashboard-panel admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Email</th>
                <th>Company</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <Fragment key={quote.id}>
                  <tr>
                    <td>{new Date(quote.createdAt).toLocaleString()}</td>
                    <td>{quote.email}</td>
                    <td>{quote.company ?? "-"}</td>
                    <td>
                      <span className={`role-pill${quote.isGuest ? " is-inactive" : ""}`}>
                        {quote.isGuest ? "Guest" : "Account"}
                      </span>
                    </td>
                    <td>{quote.itemCount}</td>
                    <td>${formatCad(quote.grandTotal)}</td>
                    <td className="admin-products-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => void toggleExpand(quote.id)}
                      >
                        {expandedId === quote.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === quote.id ? (
                    <tr key={`${quote.id}-detail`}>
                      <td colSpan={7}>
                        {isLoadingDetail || !detail ? (
                          <p className="status-message">Loading quote...</p>
                        ) : (
                          <div className="admin-quote-detail">
                            {detail.notes ? (
                              <p className="panel-copy">
                                <strong>Notes:</strong> {detail.notes}
                              </p>
                            ) : null}
                            <table className="admin-quote-items-table">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Size</th>
                                  <th>Qty</th>
                                  <th>Skids</th>
                                  <th>Price/unit</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.items.map((item, index) => (
                                  <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.size}</td>
                                    <td>
                                      {item.totalPcs} pcs ({item.totalCoverage.toFixed(1)}{" "}
                                      {item.unit})
                                    </td>
                                    <td>
                                      {item.fullSkids} skid{item.fullSkids === 1 ? "" : "s"}
                                      {item.loosePcs > 0 ? ` + ${item.loosePcs} loose` : ""}
                                    </td>
                                    <td>${formatCad(item.pricePerUnit)}</td>
                                    <td>${formatCad(item.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="admin-quote-totals">
                              <span>Material: ${formatCad(detail.materialTotal)}</span>
                              {detail.handlingTotal > 0 ? (
                                <span>Handling: ${formatCad(detail.handlingTotal)}</span>
                              ) : null}
                              {detail.discountTotal > 0 ? (
                                <span>Discount: -${formatCad(detail.discountTotal)}</span>
                              ) : null}
                              <strong>Grand total: ${formatCad(detail.grandTotal)}</strong>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
