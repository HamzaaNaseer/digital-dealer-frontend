import { useEffect, useState } from "react";
import { Link } from "../../components/Link";
import { useCategories } from "../../hooks/useCategories";
import { navigate } from "../../lib/navigation";
import {
  createAdminProduct,
  fetchAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type AdminProductAddOn,
  type AdminProductVariant,
  type ProductTone,
  type ProductUnit,
} from "../../lib/api";

const UNITS: ProductUnit[] = ["sqf", "lft", "piece", "box", "ton", "bottle"];
const TONES: ProductTone[] = ["light", "grey", "dark"];
const SEARCH_DEBOUNCE_MS = 300;

function emptyVariant(): AdminProductVariant {
  return { label: "", unit: "sqf", price: 0 };
}

export function ProductFormPage({
  token,
  productId,
}: {
  token: string;
  productId?: string;
}) {
  const isEditing = Boolean(productId);
  const { categories } = useCategories();
  const topLevelCategories = categories.filter((category) => !category.parentId);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [colorName, setColorName] = useState("");
  const [tone, setTone] = useState<ProductTone | "">("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<AdminProductVariant[]>([emptyVariant()]);
  const [selectedAddOns, setSelectedAddOns] = useState<AdminProductAddOn[]>([]);
  const [addOnSearchInput, setAddOnSearchInput] = useState("");
  const [addOnResults, setAddOnResults] = useState<AdminProductAddOn[]>([]);
  const [isSearchingAddOns, setIsSearchingAddOns] = useState(false);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subcategoryOptions = categories.filter(
    (category) => category.parentId === categoryId
  );

  useEffect(() => {
    if (!isEditing || !productId) {
      return;
    }

    let isMounted = true;

    async function loadProduct() {
      try {
        const product = await fetchAdminProduct(token, productId as string);
        if (!isMounted) return;

        setName(product.name);
        setSlug(product.slug);
        setCategoryId(product.category?.id ?? "");
        setSubcategoryId(product.subcategory?.id ?? "");
        setColorName(product.colorName);
        setTone(product.tone || "");
        setImages(product.images);
        setIsActive(product.isActive);
        setVariants(product.variants.length > 0 ? product.variants : [emptyVariant()]);
        setSelectedAddOns(product.addOns);
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load product");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [token, isEditing, productId]);

  useEffect(() => {
    const term = addOnSearchInput.trim();

    if (!term) {
      setAddOnResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setIsSearchingAddOns(true);
      fetchAdminProducts(token, term)
        .then((results) => {
          const selectedIds = new Set(selectedAddOns.map((item) => item.id));
          setAddOnResults(
            results
              .filter((item) => item.id !== productId && !selectedIds.has(item.id))
              .map((item) => ({ id: item.id, name: item.name, slug: item.slug }))
          );
        })
        .catch(() => setAddOnResults([]))
        .finally(() => setIsSearchingAddOns(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOnSearchInput, token, productId]);

  function updateVariant(index: number, patch: Partial<AdminProductVariant>) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    );
  }

  function updateVariantPackSize(
    index: number,
    patch: Partial<NonNullable<AdminProductVariant["packSize"]>>
  ) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, packSize: { ...variant.packSize, ...patch } } : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [...current, emptyVariant()]);
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_variant, i) => i !== index));
  }

  function addImage() {
    const value = imageInput.trim();
    if (!value) return;
    setImages((current) => [...current, value]);
    setImageInput("");
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_image, i) => i !== index));
  }

  function addAddOn(addOn: AdminProductAddOn) {
    setSelectedAddOns((current) => [...current, addOn]);
    setAddOnResults((current) => current.filter((item) => item.id !== addOn.id));
    setAddOnSearchInput("");
  }

  function removeAddOn(id: string) {
    setSelectedAddOns((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Select a category");
      return;
    }

    const cleanedVariants = variants.filter((variant) => variant.label.trim());
    if (cleanedVariants.length === 0) {
      setError("At least one size/variant is required");
      return;
    }

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      categoryId,
      subcategoryId: subcategoryId || null,
      colorName: colorName.trim() || undefined,
      tone: tone || undefined,
      images,
      isActive,
      variants: cleanedVariants,
      addOnProductIds: selectedAddOns.map((item) => item.id),
    };

    try {
      if (isEditing && productId) {
        await updateAdminProduct(token, productId, payload);
      } else {
        await createAdminProduct(token, payload);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product");
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="dashboard-panel">
        <p className="status-message">Loading product...</p>
      </section>
    );
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <div className="admin-products-header">
        <div>
          <p className="eyebrow">{isEditing ? "Edit product" : "New product"}</p>
          <h2>{isEditing ? name || "Edit product" : "Add product"}</h2>
        </div>
        <Link className="button button-secondary" to="/admin/products">
          Back to products
        </Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="dashboard-panel admin-form-section">
        <h3>Details</h3>
        <div className="admin-form-grid">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Slug (optional)
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto-generated from name"
            />
          </label>
          <label>
            Color name
            <input
              type="text"
              value={colorName}
              onChange={(event) => setColorName(event.target.value)}
            />
          </label>
          <label>
            Tone
            <select value={tone} onChange={(event) => setTone(event.target.value as ProductTone | "")}>
              <option value="">Unset</option>
              {TONES.map((toneOption) => (
                <option key={toneOption} value={toneOption}>
                  {toneOption}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubcategoryId("");
              }}
              required
            >
              <option value="">Select category</option>
              {topLevelCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subcategory
            <select
              value={subcategoryId}
              onChange={(event) => setSubcategoryId(event.target.value)}
              disabled={!categoryId}
            >
              <option value="">None</option>
              {subcategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-checkbox-field">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active (visible in catalog)
          </label>
        </div>
      </section>

      <section className="dashboard-panel admin-form-section">
        <h3>Images</h3>
        <div className="admin-image-input-row">
          <input
            type="url"
            placeholder="https://..."
            value={imageInput}
            onChange={(event) => setImageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImage();
              }
            }}
          />
          <button type="button" className="button button-secondary" onClick={addImage}>
            Add image
          </button>
        </div>
        {images.length > 0 ? (
          <ul className="admin-image-list">
            {images.map((image, index) => (
              <li key={`${image}-${index}`}>
                <span>{image}</span>
                <button type="button" onClick={() => removeImage(index)} aria-label="Remove image">
                  x
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel-copy">No images yet — a placeholder swatch will show instead.</p>
        )}
      </section>

      <section className="dashboard-panel admin-form-section">
        <h3>Sizes / variants</h3>
        <div className="admin-variants-list">
          {variants.map((variant, index) => (
            <div className="admin-variant-row" key={index}>
              <div className="admin-form-grid">
                <label>
                  Label
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(event) => updateVariant(index, { label: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Size
                  <input
                    type="text"
                    value={variant.size ?? ""}
                    onChange={(event) => updateVariant(index, { size: event.target.value })}
                  />
                </label>
                <label>
                  Size (mm)
                  <input
                    type="text"
                    value={variant.sizeMM ?? ""}
                    onChange={(event) => updateVariant(index, { sizeMM: event.target.value })}
                  />
                </label>
                <label>
                  Unit
                  <select
                    value={variant.unit}
                    onChange={(event) =>
                      updateVariant(index, { unit: event.target.value as ProductUnit })
                    }
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (Sug. Trade)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(index, { price: Number.parseFloat(event.target.value) || 0 })
                    }
                    required
                  />
                </label>
                <label>
                  Pieces / skid
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={variant.packSize?.piecesPerSkid ?? ""}
                    onChange={(event) =>
                      updateVariantPackSize(index, {
                        piecesPerSkid: event.target.value
                          ? Number.parseFloat(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Coverage / skid
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={variant.packSize?.coveragePerSkid ?? ""}
                    onChange={(event) =>
                      updateVariantPackSize(index, {
                        coveragePerSkid: event.target.value
                          ? Number.parseFloat(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Coverage / piece
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={variant.packSize?.coveragePerPiece ?? ""}
                    onChange={(event) =>
                      updateVariantPackSize(index, {
                        coveragePerPiece: event.target.value
                          ? Number.parseFloat(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Discount %
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={variant.discountPercent ?? ""}
                    onChange={(event) =>
                      updateVariant(index, {
                        discountPercent: event.target.value
                          ? Number.parseFloat(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Discount threshold
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={variant.discountThreshold ?? ""}
                    onChange={(event) =>
                      updateVariant(index, {
                        discountThreshold: event.target.value
                          ? Number.parseFloat(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label className="admin-checkbox-field">
                  <input
                    type="checkbox"
                    checked={variant.isNewArrival ?? false}
                    onChange={(event) =>
                      updateVariant(index, { isNewArrival: event.target.checked })
                    }
                  />
                  New arrival
                </label>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
              >
                Remove size
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button button-secondary" onClick={addVariant}>
          Add size
        </button>
      </section>

      <section className="dashboard-panel admin-form-section">
        <h3>Recommended add-ons</h3>
        <p className="panel-copy">
          Search for products to suggest alongside this one at checkout.
        </p>

        {selectedAddOns.length > 0 ? (
          <ul className="admin-addon-list">
            {selectedAddOns.map((addOn) => (
              <li key={addOn.id}>
                <span>{addOn.name}</span>
                <button type="button" onClick={() => removeAddOn(addOn.id)} aria-label={`Remove ${addOn.name}`}>
                  x
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="product-search admin-addon-search">
          <input
            type="search"
            placeholder="Search products to add as an add-on..."
            value={addOnSearchInput}
            onChange={(event) => setAddOnSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
              }
            }}
          />
        </label>

        {isSearchingAddOns ? <p className="panel-copy">Searching...</p> : null}

        {addOnResults.length > 0 ? (
          <ul className="admin-addon-results">
            {addOnResults.map((result) => (
              <li key={result.id}>
                <span>{result.name}</span>
                <button type="button" className="button button-secondary" onClick={() => addAddOn(result)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
