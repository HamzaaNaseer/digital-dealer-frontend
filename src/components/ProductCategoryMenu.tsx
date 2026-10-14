import type { Category } from "../lib/api";

export function ProductCategoryMenu({
  activeCategoryId,
  categories,
  onSelect,
}: {
  activeCategoryId: string | null;
  categories: Category[];
  onSelect: (slug: string | null) => void;
}) {
  return (
    <nav className="product-menu" aria-label="Product categories">
      <button
        className={`product-menu-item${activeCategoryId ? "" : " is-active"}`}
        type="button"
        onClick={() => onSelect(null)}
      >
        All Products
      </button>
      {categories.map((category) => (
        <button
          className={`product-menu-item${
            activeCategoryId === category.id ? " is-active" : ""
          }`}
          type="button"
          onClick={() => onSelect(category.slug)}
          key={category.id}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
