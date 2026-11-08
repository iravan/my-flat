// Split a wall face into solid rectangles around at most one opening (door or window).

export type WallHole = { along0: number; along1: number; y0: number; y1: number };
/** Rectangle on the wall face: along runs −span/2…+span/2, y runs 0…height. */
export type WallRect = { along0: number; along1: number; y0: number; y1: number };

export type WallBox = WallRect & { thick: number };

function validHole(span: number, height: number, hole: WallHole): boolean {
  const { along0, along1, y0, y1 } = hole;
  if (!(along1 > along0) || !(y1 > y0)) return false;
  if (along0 < -span / 2 || along1 > span / 2 || y0 < 0 || y1 > height) return false;
  return true;
}

/** One solid slab, or up to four rectangles around a hole. Degenerate / out-of-bounds holes are ignored (solid wall). */
export function wallRects(span: number, thick: number, height: number, hole: WallHole | null): WallBox[] {
  const X0 = -span / 2, X1 = span / 2, Y0 = 0, Y1 = height;
  const solid: WallBox[] = [{ along0: X0, along1: X1, y0: Y0, y1: Y1, thick }];
  if (!hole || !validHole(span, height, hole)) return solid;
  const { along0: x0, along1: x1, y0, y1 } = hole;
  const parts: WallRect[] = [
    { along0: X0, along1: x0, y0: Y0, y1: Y1 },
    { along0: x1, along1: X1, y0: Y0, y1: Y1 },
    { along0: x0, along1: x1, y0: Y0, y1: y0 },
    { along0: x0, along1: x1, y0: y1, y1: Y1 },
  ];
  return parts
    .filter((p) => p.along1 - p.along0 > 1e-6 && p.y1 - p.y0 > 1e-6)
    .map((p) => ({ ...p, thick }));
}
