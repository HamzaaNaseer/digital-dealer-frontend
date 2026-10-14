import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AuthUser } from "../lib/api";
import type { QuoteItem, QuoteSubmitStatus } from "../types/quote";
import { formatCad, unitAbbr } from "../utils/format";

export type QuoteContactDetails = {
  email: string;
  company?: string;
  notes?: string;
};

export function QuoteDrawer({
  items,
  status,
  error,
  user,
  onClose,
  onRemove,
  onSubmit,
  onSelectAddOn,
}: {
  items: QuoteItem[];
  status: QuoteSubmitStatus;
  error: string | null;
  user: AuthUser | null;
  onClose: () => void;
  onRemove: (index: number) => void;
  onSubmit: (details: QuoteContactDetails) => void;
  onSelectAddOn: (slug: string) => void;
}) {
  const [guestEmail, setGuestEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const showPricing = items.length > 0 && items.every((item) => item.hasPricing);
  const totalMaterial = items.reduce((sum, item) => sum + item.materialCost, 0);
  const totalHandling = items.reduce((sum, item) => sum + item.handlingFee, 0);
  const totalDiscounts = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalSkids = items.reduce((sum, item) => sum + item.fullSkids, 0);
  const totalLoose = items.reduce((sum, item) => sum + item.loosePcs, 0);
  const totalSqf = items
    .filter((item) => item.unit === "sqf")
    .reduce((sum, item) => sum + item.totalCoverage, 0);
  const totalLft = items
    .filter((item) => item.unit === "lft")
    .reduce((sum, item) => sum + item.totalCoverage, 0);

  const recommendedAddOns = useMemo(() => {
    const cartProductIds = new Set(items.map((item) => item.productId));
    const seen = new Set<string>();
    const suggestions: { id: string; slug: string; name: string }[] = [];

    for (const item of items) {
      for (const addOn of item.addOns) {
        if (cartProductIds.has(addOn.id) || seen.has(addOn.id)) continue;
        seen.add(addOn.id);
        suggestions.push({ id: addOn.id, slug: addOn.slug, name: addOn.name });
      }
    }

    return suggestions;
  }, [items]);

  function handleSubmit() {
    onSubmit({
      email: user?.email ?? guestEmail.trim(),
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const canSubmit = user ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());

  return createPortal(
    <>
      <div className="quote-drawer-overlay" role="presentation" onClick={onClose} />
      <aside className="quote-drawer" aria-label="Quote builder">
        <div className="quote-drawer-header">
          <h2>Your Quote</h2>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close quote builder"
          >
            x
          </button>
        </div>

        <div className="quote-items">
          {items.length === 0 ? (
            <div className="quote-empty">
              {status === "success" ? (
                <p>
                  Quote request sent. Our team has been notified and will follow
                  up with a formal quote.
                </p>
              ) : (
                <p>Add products from the catalog to build your quote.</p>
              )}
            </div>
          ) : (
            items.map((item, index) => (
              <div className="quote-item" key={`${item.collectionId}-${index}`}>
                {item.image ? (
                  <img
                    className="quote-item-photo"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="quote-item-swatch"
                    style={{ background: item.color }}
                  />
                )}
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.size} - {item.totalPcs} pcs -{" "}
                    {item.totalCoverage.toFixed(1)} {unitAbbr(item.unit)}
                  </span>
                  <span>
                    {item.fullSkids} skid{item.fullSkids === 1 ? "" : "s"}
                    {item.loosePcs > 0 ? ` + ${item.loosePcs} loose` : ""}
                  </span>
                  {item.hasPricing ? (
                    <strong>${formatCad(item.total)}</strong>
                  ) : (
                    <span>Pricing in formal quote</span>
                  )}
                </div>
                <button
                  className="quote-item-remove"
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${item.name}`}
                >
                  x
                </button>
              </div>
            ))
          )}
        </div>

        {recommendedAddOns.length > 0 ? (
          <div className="quote-addons">
            <p className="quote-addons-title">Recommended add-ons</p>
            <div className="quote-addons-list">
              {recommendedAddOns.map((addOn) => (
                <button
                  key={addOn.id}
                  type="button"
                  className="quote-addon-pill"
                  onClick={() => onSelectAddOn(addOn.slug)}
                >
                  + {addOn.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="quote-footer">
            <div className="quote-total-row">
              <span>Coverage</span>
              <strong>
                {totalSqf > 0 ? `${totalSqf.toFixed(0)} sqf` : ""}
                {totalSqf > 0 && totalLft > 0 ? " + " : ""}
                {totalLft > 0 ? `${totalLft.toFixed(0)} lft` : ""}
              </strong>
            </div>
            <div className="quote-total-row">
              <span>Skids / loose</span>
              <strong>
                {totalSkids} skid{totalSkids === 1 ? "" : "s"}
                {totalLoose > 0 ? ` + ${totalLoose} loose` : ""}
              </strong>
            </div>
            {showPricing ? (
              <>
                <div className="quote-total-row">
                  <span>Material</span>
                  <strong>${formatCad(totalMaterial)}</strong>
                </div>
                {totalHandling > 0 ? (
                  <div className="quote-total-row">
                    <span>Handling</span>
                    <strong>${formatCad(totalHandling)}</strong>
                  </div>
                ) : null}
                {totalDiscounts > 0 ? (
                  <div className="quote-total-row is-discount">
                    <span>Volume discount</span>
                    <strong>-${formatCad(totalDiscounts)}</strong>
                  </div>
                ) : null}
                <div className="quote-total-row is-grand">
                  <span>Estimated total</span>
                  <strong>${formatCad(grandTotal)}</strong>
                </div>
              </>
            ) : (
              <p className="quote-note">
                Sign in to see live pricing, or submit as a guest and our team
                will confirm pricing with you directly.
              </p>
            )}

            {!user ? (
              <div className="quote-guest-fields">
                <label>
                  Email <span className="required-mark">*</span>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </label>
                <label>
                  Company (optional)
                  <input
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Company name"
                  />
                </label>
              </div>
            ) : null}

            <label className="quote-notes-field">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Delivery timing, site access, anything else we should know..."
                rows={3}
              />
            </label>

            <p className="quote-note">
              Trade pricing shown in CAD. Delivery and applicable taxes are not
              included.
            </p>
            {status === "error" && error ? (
              <p className="quote-note quote-submit-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="button button-primary full-width"
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting" || !canSubmit}
            >
              {status === "submitting" ? "Sending..." : "Request Formal Quote"}
            </button>
          </div>
        ) : null}
      </aside>
    </>,
    document.body
  );
}
