import { AppHeader } from "../../components/AppHeader";
import {
  CATEGORY_IMAGE_BY_SLUG,
  DEFAULT_CATEGORY_IMAGE,
} from "../../config/categoryImages";
import { useCategories } from "../../hooks/useCategories";
import type { AuthUser } from "../../lib/api";

export function HomePage({
  authUser,
  onSignOut,
}: {
  authUser: AuthUser | null;
  onSignOut: () => void;
}) {
  const { categories } = useCategories();
  const topLevelCategories = categories.filter(
    (category) => !category.parentId,
  );

  return (
    <div className="page">
      <AppHeader authUser={authUser} onSignOut={onSignOut} />
      <main className="home-main">
        <section className="home-hero" aria-labelledby="home-heading">
          <div className="hero-copy">
            <p className="eyebrow">Landscape construction supply</p>
            <h1 id="home-heading">
              Materials that bring outdoor spaces to life.
            </h1>
            <p className="hero-text">
              Luna is a modern sourcing platform for landscape professionals,
              bringing natural stone, porcelain, installation systems, and
              outdoor construction materials together in one place. Explore
              products, build quotes, and source the materials you need — simply
              and efficiently.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/login">
                Sign in
              </a>
              <a className="button button-secondary" href="#product-categories">
                Browse Materials
              </a>
            </div>
          </div>

          <div
            className="home-featured-image"
            aria-label="Outdoor patio materials"
          >
            <img
              alt="Outdoor patio with hardscape materials"
              src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1100&q=80"
            />
            <div>
              <span>Dealer catalog</span>
              <strong>Curated materials for exceptional outdoor spaces.</strong>
            </div>
          </div>
        </section>

        <section
          className="home-categories-section"
          id="product-categories"
          aria-labelledby="categories-heading"
        >
          <div className="section-heading">
            <p className="eyebrow">Product categories</p>
            <h2 id="categories-heading">
              Built around landscape construction.
            </h2>
          </div>

          <div className="home-category-grid">
            {topLevelCategories.map((category) => (
              <a
                className="home-category-card"
                href={`/products?category=${category.slug}`}
                key={category.id}
              >
                <img
                  alt={`${category.name} category`}
                  src={
                    CATEGORY_IMAGE_BY_SLUG[category.slug] ??
                    DEFAULT_CATEGORY_IMAGE
                  }
                />
                <div>
                  <h3>{category.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
