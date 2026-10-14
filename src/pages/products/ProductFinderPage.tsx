import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { ProductCard } from "../../components/ProductCard";
import { ProductCategoryMenu } from "../../components/ProductCategoryMenu";
import { ProductDetail } from "../../components/ProductDetail";
import { ProductFilterGroup } from "../../components/ProductFilterGroup";
import { QuoteDrawer, type QuoteContactDetails } from "../../components/QuoteDrawer";
import { productToneFilters, type ProductToneFilter } from "../../config/productCatalog";
import { useCategories } from "../../hooks/useCategories";
import {
  fetchProductBySlug,
  fetchProductCollections,
  submitQuote,
  type AuthUser,
  type ProductCollection,
} from "../../lib/api";
import type { QuoteItem, QuoteSubmitStatus } from "../../types/quote";

const SEARCH_DEBOUNCE_MS = 300;

export function ProductFinderPage({
  user,
  isCheckingSession,
  getToken,
  onSignOut,
}: {
  user: AuthUser | null;
  isCheckingSession: boolean;
  getToken: () => string | null;
  onSignOut: () => void;
}) {
  const [categorySlug, setCategorySlug] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("category")
  );
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState<ProductToneFilter["id"]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductCollection | null>(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<QuoteSubmitStatus>("idle");
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCollection[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const { categories } = useCategories();
  const topLevelCategories = categories.filter((category) => !category.parentId);
  const activeCategory = topLevelCategories.find((category) => category.slug === categorySlug);
  const activeCategoryId = activeCategory?.id ?? null;
  const categoryTitle = activeCategory?.name ?? "All products";
  const availableSubcategories = categories.filter((category) =>
    activeCategory ? category.parentId === activeCategory.id : Boolean(category.parentId)
  );
  const subcategoryFilters = [
    { id: "all", label: "All Products" },
    ...availableSubcategories.map((category) => ({ id: category.id, label: category.name })),
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    let isMounted = true;
    setIsLoadingProducts(true);

    async function loadProducts() {
      try {
        const response = await fetchProductCollections(getToken(), {
          categoryId: activeCategoryId ?? undefined,
          subcategoryId: subcategoryFilter !== "all" ? subcategoryFilter : undefined,
          tone: toneFilter !== "all" ? toneFilter : undefined,
          search: debouncedSearch || undefined,
        });
        if (isMounted) {
          setProducts(response);
          setProductError(null);
        }
      } catch (error) {
        if (isMounted) {
          setProductError(
            error instanceof Error ? error.message : "Unable to load products"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [
    getToken,
    isCheckingSession,
    user,
    activeCategoryId,
    subcategoryFilter,
    toneFilter,
    debouncedSearch,
  ]);

  function selectCategory(slug: string | null) {
    setCategorySlug(slug);
    setSubcategoryFilter("all");
    const url = slug ? `/products?category=${slug}` : "/products";
    window.history.pushState({}, "", url);
  }

  function addToQuote(item: QuoteItem) {
    setQuoteItems((currentItems) => [...currentItems, item]);
    setQuoteStatus("idle");
    setQuoteError(null);
    setIsQuoteOpen(true);
  }

  function removeFromQuote(index: number) {
    setQuoteItems((currentItems) =>
      currentItems.filter((_item, itemIndex) => itemIndex !== index)
    );
  }

  function closeQuoteDrawer() {
    setIsQuoteOpen(false);
    if (quoteStatus === "success" || quoteStatus === "error") {
      setQuoteStatus("idle");
      setQuoteError(null);
    }
  }

  function handleOpenQuoteBuilder() {
    setIsQuoteOpen(true);
  }

  async function handleSelectAddOn(slug: string) {
    try {
      const product = await fetchProductBySlug(getToken(), slug);
      setActiveProduct(product);
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "Unable to load that add-on"
      );
    }
  }

  async function handleSubmitQuote(details: QuoteContactDetails) {
    setQuoteStatus("submitting");
    setQuoteError(null);

    try {
      await submitQuote(getToken(), {
        items: quoteItems.map((item) => ({
          productId: item.productId,
          variantLabel: item.variantLabel,
          quantityMode: item.quantityMode,
          quantity: item.quantity,
        })),
        email: details.email,
        company: details.company,
        notes: details.notes,
      });
      setQuoteItems([]);
      setQuoteStatus("success");
    } catch (error) {
      setQuoteStatus("error");
      setQuoteError(
        error instanceof Error ? error.message : "Unable to submit quote request"
      );
    }
  }

  return (
    <div className="page dashboard-page">
      <AppHeader authUser={user} onSignOut={onSignOut} />
      <main className="dashboard-main">
        {isCheckingSession ? (
          <section className="dashboard-panel">
            <p className="status-message">Loading products...</p>
          </section>
        ) : (
          <>
            <section className="dashboard-heading">
              <div>
                <p className="eyebrow">Product finder</p>
                <h1>{categoryTitle}</h1>
                <p className="hero-text">
                  Browse outdoor porcelain and natural stone. Select sizes,
                  enter coverage or piece count, and build an instant estimate.
                </p>
              </div>
              <button
                className="button button-secondary quote-button"
                type="button"
                onClick={handleOpenQuoteBuilder}
              >
                Quote Builder
                {quoteItems.length > 0 ? (
                  <span className="quote-count">{quoteItems.length}</span>
                ) : null}
              </button>
            </section>

            {!user ? (
              <section className="dashboard-panel signin-banner">
                <p className="panel-copy">
                  Trade pricing is only visible to signed-in customers.{" "}
                  <a href="/login">Sign in</a> to see pricing and build a quote.
                </p>
              </section>
            ) : null}

            <section className="product-finder" aria-label="Product finder">
              <aside className="product-sidebar">
                <ProductCategoryMenu
                  activeCategoryId={activeCategoryId}
                  categories={topLevelCategories}
                  onSelect={selectCategory}
                />

                <div className="product-filter-panel">
                  <ProductFilterGroup
                    activeId={subcategoryFilter}
                    filters={subcategoryFilters}
                    label="Application"
                    onSelect={setSubcategoryFilter}
                  />
                  <ProductFilterGroup
                    activeId={toneFilter}
                    filters={productToneFilters}
                    label="Tone"
                    onSelect={(id) =>
                      setToneFilter(id as ProductToneFilter["id"])
                    }
                  />
                </div>
              </aside>

              <div className="product-results">
                <div className="product-results-bar">
                  <label className="product-search">
                    <input
                      type="search"
                      placeholder="Search products..."
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      aria-label="Search products"
                    />
                  </label>
                  <span className="product-results-count">
                    {products.length} collection
                    {products.length === 1 ? "" : "s"}
                  </span>
                </div>

                {isLoadingProducts ? (
                  <section className="dashboard-panel">
                    <p className="status-message">Loading product catalog...</p>
                  </section>
                ) : productError ? (
                  <section className="dashboard-panel">
                    <p className="status-message error">{productError}</p>
                  </section>
                ) : products.length > 0 ? (
                  <div className="catalog-grid">
                    {products.map((collection) => (
                      <ProductCard
                        collection={collection}
                        key={collection.id}
                        onClick={() => setActiveProduct(collection)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-panel product-empty-state">
                    <p className="eyebrow">Catalog</p>
                    <h2>No collections found</h2>
                    <p className="panel-copy">
                      Adjust the selected category, application, or tone
                      filters.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {activeProduct ? (
              <ProductDetail
                collection={activeProduct}
                onAddToQuote={addToQuote}
                onClose={() => setActiveProduct(null)}
              />
            ) : null}
            {isQuoteOpen ? (
              <QuoteDrawer
                items={quoteItems}
                status={quoteStatus}
                error={quoteError}
                user={user}
                onClose={closeQuoteDrawer}
                onRemove={removeFromQuote}
                onSubmit={(details) => void handleSubmitQuote(details)}
                onSelectAddOn={(slug) => void handleSelectAddOn(slug)}
              />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
