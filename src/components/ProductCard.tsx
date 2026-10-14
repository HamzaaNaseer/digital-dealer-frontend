import type { ProductCollection } from "../lib/api";
import { swatchColorFor, unitLabel } from "../utils/format";

export function ProductCard({
  collection,
  onClick,
}: {
  collection: ProductCollection;
  onClick: () => void;
}) {
  const unit = collection.variants[0].unit;
  const hasPricing = collection.variants.some((variant) => variant.price !== null);
  const prices = collection.variants
    .map((variant) => variant.price)
    .filter((price): price is number => price !== null);
  const lowPrice = hasPricing ? Math.min(...prices) : null;
  const highPrice = hasPricing ? Math.max(...prices) : null;
  const categoryLabel = collection.category?.name ?? "Products";
  const isNewArrival = collection.variants.some((variant) => variant.isNewArrival);
  const { color, colorAlt } = swatchColorFor(collection.colorName ?? collection.name);

  return (
    <button className="product-card" type="button" onClick={onClick}>
      <div className="product-card-swatch">
        {collection.images[0] ? (
          <img
            className="product-card-photo"
            alt={collection.name}
            src={collection.images[0]}
            loading="lazy"
          />
        ) : (
          <>
            <div style={{ background: color }} />
            <div
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${colorAlt} 100%)`,
              }}
            />
          </>
        )}
        {isNewArrival ? <span className="new-badge">New</span> : null}
        <span className="category-badge">{categoryLabel}</span>
      </div>
      <div className="product-card-body">
        <h2>{collection.name}</h2>
        <p>
          {collection.variants.length} size
          {collection.variants.length === 1 ? "" : "s"} - {categoryLabel}
        </p>
        <div className="product-size-list">
          {collection.variants.slice(0, 4).map((variant) => (
            <span
              className={`size-chip${variant.isNewArrival ? " is-new" : ""}`}
              key={variant.label}
            >
              {variant.label}
              {variant.isNewArrival ? " new" : ""}
            </span>
          ))}
          {collection.variants.length > 4 ? (
            <span className="size-chip size-chip-more">
              +{collection.variants.length - 4} more
            </span>
          ) : null}
        </div>
        <span className="product-price">
          {hasPricing && lowPrice !== null && highPrice !== null ? (
            <>
              From <strong>${lowPrice.toFixed(2)}</strong>/{unitLabel(unit)}
              {highPrice !== lowPrice ? (
                <>
                  {" "}
                  to <strong>${highPrice.toFixed(2)}</strong>/{unitLabel(unit)}
                </>
              ) : null}
            </>
          ) : (
            "Sign in for pricing"
          )}
        </span>
      </div>
    </button>
  );
}
