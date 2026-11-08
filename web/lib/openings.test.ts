import { describe, expect, it } from "vitest";
import { wallRects } from "./openings";

describe("wallRects", () => {
  const span = 4, thick = 0.1, height = 2.6;

  it("returns one solid box with no hole", () => {
    expect(wallRects(span, thick, height, null)).toEqual([
      { along0: -2, along1: 2, y0: 0, y1: 2.6, thick: 0.1 },
    ]);
  });

  it("splits around a hole in the middle", () => {
    const hole = { along0: -0.7, along1: 0.7, y0: 1.05, y1: 2.05 };
    const boxes = wallRects(span, thick, height, hole);
    expect(boxes).toHaveLength(4);
    expect(boxes.some((b) => b.along0 === -2 && b.along1 === -0.7)).toBe(true);
    expect(boxes.some((b) => b.along0 === 0.7 && b.along1 === 2)).toBe(true);
    expect(boxes.some((b) => b.y1 === 1.05 && b.along0 === -0.7)).toBe(true);
    expect(boxes.some((b) => b.y0 === 2.05 && b.along0 === -0.7)).toBe(true);
  });

  it("keeps a hole near an end inside the 0.05 m margin", () => {
    const hole = { along0: -2 + 0.05, along1: -2 + 0.05 + 0.8, y0: 0, y1: 2.05 };
    const boxes = wallRects(span, thick, height, hole);
    expect(boxes.length).toBeGreaterThan(1);
    expect(boxes.every((b) => b.along0 >= -2 - 1e-9 && b.along1 <= 2 + 1e-9)).toBe(true);
  });

  it("accepts a door from the floor", () => {
    const hole = { along0: -0.4, along1: 0.4, y0: 0, y1: 2.05 };
    const boxes = wallRects(span, thick, height, hole);
    expect(boxes.some((b) => b.y0 === 0 && b.y1 === 0)).toBe(false); // no zero-height under-door strip
    expect(boxes.some((b) => b.along0 === -0.4 && b.along1 === 0.4 && b.y0 === 2.05)).toBe(true);
  });

  it("rejects a degenerate hole and returns a solid wall", () => {
    expect(wallRects(span, thick, height, { along0: 1, along1: 0, y0: 0, y1: 1 })).toHaveLength(1);
    expect(wallRects(span, thick, height, { along0: -3, along1: -2.5, y0: 0, y1: 1 })).toHaveLength(1);
  });
});
