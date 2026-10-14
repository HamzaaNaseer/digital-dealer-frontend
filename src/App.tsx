import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "./lib/auth";
import { navigate } from "./lib/navigation";
import { fetchCurrentUser, type AuthUser } from "./lib/api";
import { HomePage } from "./pages/marketing/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { ProductFinderPage } from "./pages/products/ProductFinderPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { ProductFormPage } from "./pages/admin/ProductFormPage";
import { QuotesPage } from "./pages/admin/QuotesPage";

function currentLocation() {
  return window.location.pathname + window.location.search;
}

export function App() {
  const [location, setLocation] = useState(currentLocation);
  const path = location.split("?")[0];
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    function handlePopState() {
      setLocation(currentLocation());
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setIsCheckingSession(false);
      return;
    }
    const authToken = token;

    async function loadSession() {
      try {
        const currentUser = await fetchCurrentUser(authToken);
        if (isMounted) {
          setAuthUser(currentUser);
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        if (isMounted) {
          setAuthUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAuthenticated(token: string, user: AuthUser) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
    navigate(user.role === "admin" ? "/admin" : "/products");
  }

  function handleSignOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthUser(null);
    navigate("/login");
  }

  const getToken = useCallback(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }, []);

  useEffect(() => {
    if (path === "/login" && authUser?.role === "admin") {
      navigate("/admin");
    }
  }, [path, authUser]);

  if (path === "/login") {
    if (authUser) {
      if (authUser.role === "admin") {
        return null;
      }

      return (
        <ProductFinderPage
          user={authUser}
          isCheckingSession={false}
          getToken={getToken}
          onSignOut={handleSignOut}
        />
      );
    }

    return (
      <LoginPage
        authUser={authUser}
        isCheckingSession={isCheckingSession}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
      />
    );
  }

  if (path === "/products" || path === "/dashboard") {
    return (
      <ProductFinderPage
        user={authUser}
        isCheckingSession={isCheckingSession}
        getToken={getToken}
        onSignOut={handleSignOut}
      />
    );
  }

  if (path === "/admin") {
    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="dashboard"
      >
        {getToken() ? <AdminOverviewPage token={getToken() as string} /> : null}
      </AdminLayout>
    );
  }

  if (path === "/admin/quotes") {
    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="quotes"
      >
        {getToken() ? <QuotesPage token={getToken() as string} /> : null}
      </AdminLayout>
    );
  }

  if (path === "/admin/users") {
    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="users"
      >
        {getToken() ? <UsersPage token={getToken() as string} /> : null}
      </AdminLayout>
    );
  }

  if (path === "/admin/products") {
    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="products"
      >
        {getToken() ? <ProductsPage token={getToken() as string} /> : null}
      </AdminLayout>
    );
  }

  if (path === "/admin/products/new") {
    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="products"
      >
        {getToken() ? <ProductFormPage token={getToken() as string} /> : null}
      </AdminLayout>
    );
  }

  if (path === "/admin/products/edit") {
    const productId = new URLSearchParams(location.split("?")[1]).get("id") ?? undefined;

    return (
      <AdminLayout
        user={authUser}
        isCheckingSession={isCheckingSession}
        onSignOut={handleSignOut}
        activeSection="products"
      >
        {getToken() ? (
          <ProductFormPage token={getToken() as string} productId={productId} />
        ) : null}
      </AdminLayout>
    );
  }

  return <HomePage authUser={authUser} onSignOut={handleSignOut} />;
}
