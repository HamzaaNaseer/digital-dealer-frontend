const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
);

export type HealthResponse = {
  status: string;
  service: string;
  database: string;
  checkedAt: string;
};

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type ManagedUser = AuthUser & {
  createdAt: string;
};

export type ProductUnit = "sqf" | "lft" | "piece" | "box" | "ton" | "bottle";
export type ProductTone = "light" | "grey" | "dark";

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type ProductVariantPackSize = {
  piecesPerSkid?: number;
  coveragePerSkid?: number;
  coveragePerPiece?: number;
  piecesPerBox?: number;
};

export type ProductVariant = {
  label: string;
  size?: string;
  sizeMM?: string;
  unit: ProductUnit;
  packSize?: ProductVariantPackSize;
  isNewArrival?: boolean;
  price: number | null;
  discountPercent?: number;
  discountThreshold?: number;
};

export type ProductAddOn = {
  id: string;
  slug: string;
  name: string;
  images: string[];
};

export type ProductCollection = {
  id: string;
  productId: string;
  name: string;
  colorName?: string;
  tone?: ProductTone;
  images: string[];
  category: Category;
  subcategory: Category;
  addOns: ProductAddOn[];
  variants: ProductVariant[];
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to sign in");
  }

  return response.json();
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Session expired");
  }

  const body = (await response.json()) as { user: AuthUser };
  return body.user;
}

export async function fetchUsers(token: string): Promise<ManagedUser[]> {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to load users");
  }

  const body = (await response.json()) as { users: ManagedUser[] };
  return body.users;
}

export type ProductFilters = {
  categoryId?: string;
  subcategoryId?: string;
  tone?: string;
  search?: string;
};

export async function fetchProductCollections(
  token: string | null,
  filters: ProductFilters = {}
): Promise<ProductCollection[]> {
  const params = new URLSearchParams();

  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.subcategoryId) params.set("subcategoryId", filters.subcategoryId);
  if (filters.tone) params.set("tone", filters.tone);
  if (filters.search) params.set("search", filters.search);

  const queryString = params.toString();
  const response = await fetch(
    `${API_URL}/api/products${queryString ? `?${queryString}` : ""}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to load products");
  }

  const body = (await response.json()) as { products: ProductCollection[] };
  return body.products;
}

export async function fetchProductBySlug(
  token: string | null,
  slug: string
): Promise<ProductCollection> {
  const response = await fetch(`${API_URL}/api/products/${slug}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to load product");
  }

  const body = (await response.json()) as { product: ProductCollection };
  return body.product;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/categories`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to load categories");
  }

  const body = (await response.json()) as { categories: Category[] };
  return body.categories;
}

export type QuoteSubmissionItem = {
  productId: string;
  variantLabel: string;
  quantityMode: "coverage" | "pieces";
  quantity: number;
};

export type QuoteSubmission = {
  items: QuoteSubmissionItem[];
  email?: string;
  company?: string;
  notes?: string;
};

export async function submitQuote(
  token: string | null,
  submission: QuoteSubmission
): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/api/quotes`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to submit quote request");
  }

  const body = (await response.json()) as { quote: { id: string } };
  return body.quote;
}

export type AdminProductVariant = {
  label: string;
  size?: string;
  sizeMM?: string;
  unit: ProductUnit;
  price: number;
  packSize?: ProductVariantPackSize;
  discountPercent?: number;
  discountThreshold?: number;
  isNewArrival?: boolean;
};

export type AdminProductAddOn = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: Category | null;
  subcategory: Category | null;
  colorName: string;
  tone: ProductTone | "";
  images: string[];
  isActive: boolean;
  variants: AdminProductVariant[];
  addOnProductIds: string[];
  addOns: AdminProductAddOn[];
};

export type AdminProductPayload = {
  name: string;
  slug?: string;
  categoryId: string;
  subcategoryId: string | null;
  colorName?: string;
  tone?: ProductTone;
  images: string[];
  isActive: boolean;
  variants: AdminProductVariant[];
  addOnProductIds: string[];
};

async function adminProductsRequest<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin/products${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed");
  }

  return response.json();
}

export async function fetchAdminProducts(
  token: string,
  search?: string
): Promise<AdminProduct[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const queryString = params.toString();

  const body = await adminProductsRequest<{ products: AdminProduct[] }>(
    token,
    queryString ? `?${queryString}` : ""
  );
  return body.products;
}

export async function fetchAdminProduct(token: string, id: string): Promise<AdminProduct> {
  const body = await adminProductsRequest<{ product: AdminProduct }>(token, `/${id}`);
  return body.product;
}

export async function createAdminProduct(
  token: string,
  payload: AdminProductPayload
): Promise<AdminProduct> {
  const body = await adminProductsRequest<{ product: AdminProduct }>(token, "", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.product;
}

export async function updateAdminProduct(
  token: string,
  id: string,
  payload: AdminProductPayload
): Promise<AdminProduct> {
  const body = await adminProductsRequest<{ product: AdminProduct }>(token, `/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return body.product;
}

export async function deleteAdminProduct(token: string, id: string): Promise<void> {
  await adminProductsRequest<{ success: boolean }>(token, `/${id}`, {
    method: "DELETE",
  });
}

export type AdminQuoteSummary = {
  id: string;
  email: string;
  company: string | null;
  isGuest: boolean;
  itemCount: number;
  grandTotal: number;
  createdAt: string;
};

export type AdminQuoteItem = {
  name: string;
  size: string;
  unit: ProductUnit;
  totalPcs: number;
  totalCoverage: number;
  fullSkids: number;
  loosePcs: number;
  pricePerUnit: number;
  materialCost: number;
  handlingFee: number;
  discountAmount: number;
  total: number;
};

export type AdminQuoteDetail = AdminQuoteSummary & {
  notes: string | null;
  items: AdminQuoteItem[];
  materialTotal: number;
  handlingTotal: number;
  discountTotal: number;
};

async function adminQuotesRequest<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin/quotes${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed");
  }

  return response.json();
}

export async function fetchAdminQuotes(
  token: string,
  search?: string
): Promise<AdminQuoteSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const queryString = params.toString();

  const body = await adminQuotesRequest<{ quotes: AdminQuoteSummary[] }>(
    token,
    queryString ? `?${queryString}` : ""
  );
  return body.quotes;
}

export async function fetchAdminQuote(token: string, id: string): Promise<AdminQuoteDetail> {
  const body = await adminQuotesRequest<{ quote: AdminQuoteDetail }>(token, `/${id}`);
  return body.quote;
}

export async function createUser(
  token: string,
  input: { email: string; password: string; role: UserRole }
): Promise<ManagedUser> {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Unable to create user");
  }

  const body = (await response.json()) as { user: ManagedUser };
  return body.user;
}
