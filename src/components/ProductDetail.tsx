import { useState } from "react";
import { createPortal } from "react-dom";
import type { ProductCollection, ProductVariant } from "../lib/api";
import { handlingRate } from "../config/productCatalog";
import type { QuoteItem } from "../types/quote";
import { formatCad, swatchColorFor, unitAbbr, unitLabel } from "../utils/format";

// Falls back to deriving coverage-per-piece from coveragePerSkid/piecesPerSkid
// when the source data doesn't give it directly, instead of silently
// assuming 1 (which was wrong for both the table display and quote math).
function coveragePerPieceFor(packSize: ProductVariant["packSize"]): number | null {
  if (packSize?.coveragePerPiece) return packSize.coveragePerPiece;
  if (packSize?.coveragePerSkid && packSize?.piecesPerSkid) {
    return packSize.coveragePerSkid / packSize.piecesPerSkid;
  }
  return null;
}

export function ProductDetail({
  collection,
  onAddToQuote,
  onClose,
}: {
  collection: ProductCollection;
  onAddToQuote: (item: QuoteItem) => void;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantityInput, setQuantityInput] = useState("");
  const variant = collection.variants[selectedIndex];
  const quantityMode: "coverage" | "pieces" =
    variant.unit === "sqf" || variant.unit === "lft" ? "coverage" : "pieces";
  const hasPricing = variant.price !== null;
  const price = variant.price ?? 0;
  const coveragePerPiece = coveragePerPieceFor(variant.packSize) ?? 1;
  const piecesPerSkid = variant.packSize?.piecesPerSkid ?? Infinity;
  const showCoveragePerSkidColumn = collection.variants.some(
    (item) => item.packSize?.coveragePerSkid
  );
  const showPiecesPerSkidColumn = collection.variants.some(
    (item) => item.packSize?.piecesPerSkid
  );
  const hasSkidData = Number.isFinite(piecesPerSkid);
  const { color: swatchColor } = swatchColorFor(collection.colorName ?? collection.name);
  const quantity = Number.parseFloat(quantityInput) || 0;
  const totalPcs =
    quantity <= 0
      ? 0
      : quantityMode === "pieces"
        ? Math.ceil(quantity)
        : Math.ceil(quantity / coveragePerPiece);
  const fullSkids = hasSkidData ? Math.floor(totalPcs / piecesPerSkid) : 0;
  const loosePcs = hasSkidData ? totalPcs % piecesPerSkid : totalPcs;
  const fullSkidPcs = hasSkidData ? fullSkids * piecesPerSkid : 0;
  const fullSkidCoverage = fullSkidPcs * coveragePerPiece;
  const looseCoverage = loosePcs * coveragePerPiece;
  const totalCoverage = totalPcs * coveragePerPiece;
  const materialCost = totalCoverage * price;
  const looseMaterialCost = looseCoverage * price;
  const handlingFee = loosePcs > 0 ? looseMaterialCost * handlingRate : 0;
  const discountApplied = Boolean(
    variant.discountPercent && totalCoverage >= (variant.discountThreshold ?? Infinity)
  );
  const discountAmount = discountApplied
    ? materialCost * ((variant.discountPercent ?? 0) / 100)
    : 0;
  const total = materialCost + handlingFee - discountAmount;
  const hasOrder = totalPcs > 0;
  const quantityPromptLabel =
    unitLabel(variant.unit).charAt(0).toUpperCase() + unitLabel(variant.unit).slice(1);

  function handleAddToQuote() {
    if (!hasOrder) {
      return;
    }

    onAddToQuote({
      productId: collection.productId,
      variantLabel: variant.label,
      quantityMode,
      quantity,
      collectionId: collection.id,
      name: collection.name,
      color: swatchColor,
      image: collection.images[0] ?? null,
      size: variant.size ?? variant.label,
      sizeMM: variant.sizeMM ?? "",
      unit: variant.unit,
      hasPricing,
      addOns: collection.addOns,
      pricePerUnit: price,
      coveragePc: coveragePerPiece,
      pcsSkid: Number.isFinite(piecesPerSkid) ? piecesPerSkid : 0,
      fullSkids,
      loosePcs,
      totalPcs,
      totalCoverage,
      materialCost,
      handlingFee,
      discountAmount,
      total,
      discountApplied,
    });
    onClose();
  }

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="product-modal"
        aria-label={`${collection.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="product-modal-header">
          <div>
            <h2>{collection.name}</h2>
            <p>
              {collection.category?.name ?? "Products"}
              {collection.subcategory ? ` - ${collection.subcategory.name}` : ""}
            </p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close product details"
          >
            x
          </button>
        </div>

        <div className="product-modal-swatch">
          {collection.images[0] ? (
            <img
              className="product-modal-photo"
              alt={collection.name}
              src={collection.images[0]}
              loading="lazy"
            />
          ) : (
            (() => {
              const { color, colorAlt } = swatchColorFor(
                collection.colorName ?? collection.name
              );
              return (
                <>
                  <div style={{ background: color }} />
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${color} 0%, ${colorAlt} 100%)`,
                    }}
                  />
                </>
              );
            })()
          )}
        </div>

        <div className="product-modal-body">
          <section className="variant-section">
            <p className="variant-section-title">Select size</p>
            <div className="variant-table-wrap">
              <table className="variant-table">
                <thead>
                  <tr>
                    <th aria-label="Selected"></th>
                    <th>Size</th>
                    {showCoveragePerSkidColumn ? (
                      <th>{unitAbbr(variant.unit).toUpperCase()} / skid</th>
                    ) : null}
                    {showPiecesPerSkidColumn ? <th>PCS / skid</th> : null}
                    <th>Trade price</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.variants.map((item, index) => (
                    <tr
                      className={`variant-row${
                        index === selectedIndex ? " is-selected" : ""
                      }`}
                      key={item.label}
                      onClick={() => {
                        setSelectedIndex(index);
                        setQuantityInput("");
                      }}
                    >
                      <td>
                        <span
                          className={`variant-radio${
                            index === selectedIndex ? " is-checked" : ""
                          }`}
                        />
                      </td>
                      <td>
                        <strong>{item.size ?? item.label}</strong>
                        {coveragePerPieceFor(item.packSize) ? (
                          <span>
                            {item.sizeMM ?? ""} -{" "}
                            {coveragePerPieceFor(item.packSize)} {unitAbbr(item.unit)}
                            /pc
                          </span>
                        ) : null}
                      </td>
                      {showCoveragePerSkidColumn ? (
                        <td>
                          {item.packSize?.coveragePerSkid ?? "-"} {unitAbbr(item.unit)}
                        </td>
                      ) : null}
                      {showPiecesPerSkidColumn ? (
                        <td>{item.packSize?.piecesPerSkid ?? "-"} pcs</td>
                      ) : null}
                      <td>
                        {item.price !== null ? (
                          <>
                            <strong>${item.price.toFixed(2)}</strong>/
                            {unitAbbr(item.unit)}
                            {item.discountPercent ? (
                              <span className="discount-badge">
                                {item.discountPercent}% at {item.discountThreshold ?? 0}+
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <a href="/login">Sign in</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="add-section">
            {!hasPricing ? (
              <div className="dashboard-panel signin-banner">
                <p className="panel-copy">
                  Trade pricing is only visible to signed-in customers. You can
                  still request a quote below — <a href="/login">sign in</a>{" "}
                  to see live pricing instead.
                </p>
              </div>
            ) : null}

            <label className="quantity-field">
              {quantityPromptLabel} needed
              <span>
                <input
                  min="1"
                  placeholder="0"
                  type="number"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                />
                <em>{unitAbbr(variant.unit)}</em>
              </span>
            </label>

            {hasOrder ? (
              <div className="quote-breakdown">
                <p className="variant-section-title">Order breakdown</p>
                {hasSkidData ? (
                  <div className="breakdown-row">
                    <span>
                      {fullSkids} full skid{fullSkids === 1 ? "" : "s"} x{" "}
                      {piecesPerSkid} pcs
                    </span>
                    <strong>
                      {fullSkidPcs} pcs ({fullSkidCoverage.toFixed(0)}{" "}
                      {unitAbbr(variant.unit)})
                    </strong>
                  </div>
                ) : null}
                {loosePcs > 0 ? (
                  <div className="breakdown-row is-loose">
                    <span>
                      {loosePcs} loose piece{loosePcs === 1 ? "" : "s"}
                    </span>
                    <strong>
                      {looseCoverage.toFixed(1)} {unitAbbr(variant.unit)}
                    </strong>
                  </div>
                ) : null}
                <div className="breakdown-row is-total">
                  <span>Total</span>
                  <strong>
                    {totalPcs} pcs - {totalCoverage.toFixed(1)}{" "}
                    {unitAbbr(variant.unit)}
                  </strong>
                </div>
                {hasPricing ? (
                  <>
                    <div className="breakdown-row">
                      <span>
                        Material ({totalCoverage.toFixed(1)} {unitAbbr(variant.unit)} x
                        ${price.toFixed(2)})
                      </span>
                      <strong>${formatCad(materialCost)}</strong>
                    </div>
                    {handlingFee > 0 ? (
                      <div className="breakdown-row is-loose">
                        <span>Handling - 20% on loose pieces</span>
                        <strong>${formatCad(handlingFee)}</strong>
                      </div>
                    ) : null}
                    {discountApplied ? (
                      <div className="breakdown-row is-discount">
                        <span>Volume discount</span>
                        <strong>-${formatCad(discountAmount)}</strong>
                      </div>
                    ) : null}
                    <div className="breakdown-grand">
                      <span>Estimated total</span>
                      <strong>${formatCad(total)}</strong>
                    </div>
                  </>
                ) : (
                  <p className="quote-note">
                    Pricing will be confirmed in your formal quote.
                  </p>
                )}
              </div>
            ) : null}

            <button
              className="button button-primary full-width"
              type="button"
              disabled={!hasOrder}
              onClick={handleAddToQuote}
            >
              {hasOrder
                ? hasSkidData
                  ? `Add to quote - ${fullSkids} skid${
                      fullSkids === 1 ? "" : "s"
                    }${loosePcs > 0 ? ` + ${loosePcs} loose` : ""}`
                  : `Add to quote - ${totalPcs} pcs`
                : "Enter quantity to continue"}
            </button>
          </section>
        </div>
      </section>
    </div>,
    document.body
  );
}
