import { describe, expect, it } from "vitest";
import { CATALOGUE, catalogueEntry, catalogueKind, UI_PIECE_CAP } from "./catalogue";

describe("catalogue", () => {
  it("whitelists furniture kinds and not vinyl clutter", () => {
    expect(catalogueKind("bed")).toBe(true);
    expect(catalogueKind("chair")).toBe(true);
    expect(catalogueEntry("chair")?.defaultLook).toBe("windsor");
    expect(catalogueEntry("bed")?.defaultLook).toBe("spindle-pine");
    expect(catalogueEntry("lamp")?.sits).toBe(true);
    expect(catalogueEntry("door")?.opening).toBe(true);
    expect(catalogueEntry("ceiling-light")?.max).toBe(1);
    expect(catalogueKind("turntable")).toBe(false);
    expect(catalogueKind("hoodie")).toBe(false);
    expect(UI_PIECE_CAP).toBe(40);
    expect(CATALOGUE.every((e) => catalogueKind(e.kind))).toBe(true);
  });
});
