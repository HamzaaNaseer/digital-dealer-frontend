import { useEffect, useState } from "react";
import { fetchCategories, type Category } from "../lib/api";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetchCategories();
        if (isMounted) {
          setCategories(response);
        }
      } catch {
        // Category load failures degrade to an empty menu rather than blocking the page.
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, isLoadingCategories };
}
