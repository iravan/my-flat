import { useLayout } from "@/lib/room";
import { itemDefaults } from "@/lib/config";
import { ITEMS } from "./registry";
import { VARIANTS } from "./variants";
import type { VariantDef } from "./types";

// Which look a kind/piece shows: options[pieceId].look → style default for kind → first variant.
export function variantId(
  kind: string,
  pieceId: string = kind,
  s: { style: string; options: Record<string, Record<string, string>> } = useLayout.getState(),
) {
  const have = VARIANTS[kind] ?? {};
  for (const id of [s.options[pieceId]?.look, itemDefaults(s.style, kind).variant, ITEMS[kind]?.variants[0]]) {
    if (id && have[id]) return id;
  }
  return Object.keys(have)[0];
}
export const variantOf = (kind: string, pieceId: string = kind): VariantDef | undefined =>
  VARIANTS[kind]?.[variantId(kind, pieceId)];

export function useVariant(kind: string, pieceId: string = kind): VariantDef | undefined {
  const pick = useLayout((s) => s.options[pieceId]?.look), style = useLayout((s) => s.style);
  return VARIANTS[kind]?.[variantId(kind, pieceId, { style, options: { [pieceId]: { look: pick ?? "" } } })];
}
