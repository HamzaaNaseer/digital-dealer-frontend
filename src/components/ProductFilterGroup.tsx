export function ProductFilterGroup({
  activeId,
  filters,
  label,
  onSelect,
}: {
  activeId: string;
  filters: Array<{ id: string; label: string }>;
  label: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="product-filter-group">
      <span className="product-filter-label">{label}</span>
      <div className="product-filter-pills">
        {filters.map((filter) => (
          <button
            className={`product-filter-pill${
              activeId === filter.id ? " is-active" : ""
            }`}
            key={filter.id}
            type="button"
            onClick={() => onSelect(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
