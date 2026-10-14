import type { ProductAddOn, ProductUnit } from "../lib/api";

export type QuoteItem = {
  productId: string;
  variantLabel: string;
  quantityMode: "coverage" | "pieces";
  quantity: number;
  collectionId: string;
  name: string;
  color: string;
  image: string | null;
  size: string;
  sizeMM: string;
  unit: ProductUnit;
  hasPricing: boolean;
  addOns: ProductAddOn[];
  pricePerUnit: number;
  coveragePc: number;
  pcsSkid: number;
  fullSkids: number;
  loosePcs: number;
  totalPcs: number;
  totalCoverage: number;
  materialCost: number;
  handlingFee: number;
  discountAmount: number;
  total: number;
  discountApplied: boolean;
};

export type QuoteSubmitStatus = "idle" | "submitting" | "success" | "error";
