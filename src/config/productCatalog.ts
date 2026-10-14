import type { ProductTone } from "../lib/api";

export type ProductToneFilter = {
  id: "all" | ProductTone;
  label: string;
};

export const handlingRate = 0.2;

export const productToneFilters: ProductToneFilter[] = [
  { id: "all", label: "All" },
  { id: "light", label: "Light" },
  { id: "grey", label: "Grey" },
  { id: "dark", label: "Dark" },
];
