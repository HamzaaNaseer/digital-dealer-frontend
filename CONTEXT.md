# Context

This is the frontend for "Luna," a B2B landscape/hardscape materials dealer portal, built for an Upwork client engagement. It was extracted from a monorepo (`digital-dealer-core`, owned by the client under `yash-6ix` on GitHub) into this standalone repo so it could be deployed independently on Vercel under the developer's own account, after the client's Heroku backend app was removed and broke the previous deployment.

## Stack
- React 19 + Vite + TypeScript
- No router library — hand-rolled SPA navigation via `src/lib/navigation.ts` (`navigate()` using `history.pushState` + manual `popstate` dispatch) and `src/components/Link.tsx`
- Talks to a separate backend repo (`digital-dealer-backend`, Express/Mongoose) over HTTP, via `VITE_API_URL` (see `src/lib/api.ts`)

## Deployment
- Hosted on Vercel, under the developer's own account (not the client's)
- Required env var in Vercel project settings: `VITE_API_URL` — must point at the live backend (Heroku app URL), otherwise it falls back to `http://localhost:4000` and nothing will work in production
- `vercel.json` already has the SPA rewrite rule needed for client-side routing to work on refresh/deep links
- The backend's `CORS_ORIGIN` env var must include this app's deployed URL, or API calls will be blocked by the browser

## Structure
- `src/pages/` — split by area: `admin/`, `auth/`, `marketing/`, `products/`
- `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/`, `src/config/` — standard separation
- Full admin dashboard (Products, Quotes, Users) lives under `src/pages/admin/`
- Guest + authenticated quotation flow lives in `src/components/QuoteDrawer.tsx` + `src/pages/products/ProductFinderPage.tsx`

## Known gaps / things to watch
- The product catalog is being rebuilt from an updated source file; existing products will be removed and re-added. Don't assume current product/image data reflects what's about to exist.
- Pricing math (`quantityMode`, skid/piece breakdown, handling fee, volume discounts) is mirrored server-side in the backend for quote submission — don't change frontend pricing logic without checking `quote-calculator.ts` on the backend stays in sync
