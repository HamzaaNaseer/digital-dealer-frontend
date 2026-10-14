import type { ProductUnit } from "../lib/api";

export function swatchColorFor(seed: string): { color: string; colorAlt: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    color: `hsl(${hue}, 18%, 55%)`,
    colorAlt: `hsl(${hue}, 18%, 68%)`,
  };
}

const UNIT_LABELS: Record<ProductUnit, string> = {
  sqf: "sq ft",
  lft: "lin ft",
  piece: "pieces",
  box: "boxes",
  ton: "tons",
  bottle: "bottles",
};

const UNIT_ABBR: Record<ProductUnit, string> = {
  sqf: "sqf",
  lft: "lft",
  piece: "pcs",
  box: "box",
  ton: "ton",
  bottle: "btl",
};

export function unitLabel(unit: ProductUnit) {
  return UNIT_LABELS[unit] ?? unit;
}

export function unitAbbr(unit: ProductUnit) {
  return UNIT_ABBR[unit] ?? unit;
}

export function formatCad(value: number) {
  return value.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
