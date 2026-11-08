import { ITEMS } from "@/items/registry";

export type Mount = "floor" | "wall" | "ceiling";
export type CatalogueEntry = {
  kind: string;
  label: string;
  mount: Mount;
  max?: number;
  opening?: boolean;
  sits?: boolean;
  looks?: string[];
  defaultLook?: string;
};

export const CATALOGUE: CatalogueEntry[] = [
  { kind: "bed", label: "Bed", mount: "floor", defaultLook: "spindle-pine" },
  { kind: "desk", label: "Desk", mount: "floor" },
  { kind: "chair", label: "Chair", mount: "floor", defaultLook: "windsor" },
  { kind: "nightstand", label: "Nightstand", mount: "floor" },
  { kind: "rug", label: "Rug", mount: "floor", looks: ["woven", "braided"], defaultLook: "woven" },
  { kind: "lamp", label: "Lamp", mount: "floor", sits: true },
  { kind: "bin", label: "Bin", mount: "floor" },
  { kind: "wall-shelf", label: "Wall shelf", mount: "wall" },
  { kind: "door", label: "Door", mount: "wall", opening: true },
  { kind: "window", label: "Window", mount: "wall", opening: true },
  { kind: "ceiling-light", label: "Ceiling light", mount: "ceiling", max: 1 },
];

const BY_KIND = Object.fromEntries(CATALOGUE.map((e) => [e.kind, e]));

export const catalogueEntry = (kind: string): CatalogueEntry | undefined => BY_KIND[kind];

export const catalogueKind = (kind: string) => !!BY_KIND[kind] && !!ITEMS[kind];

export const UI_PIECE_CAP = 40;
