import { describe, expect, it } from "vitest";
import {
  buildShell, clampWalk, doorsOf, DREAM, FLOORPLANS, planArea, planBounds as planBoundsOf, pointInRoom, roomAt, roomBounds, shimizu, SQFT,
} from "./flat-plan";

describe("shimizu (清水樓)", () => {
  const plan = shimizu();

  it("is an open-plan shell: only kitchen and bath are walled off", () => {
    expect(plan.name).toBe("清水樓");
    expect(plan.rooms.map((r) => r.id).sort()).toEqual(
      ["bath", "entry", "kitchen", "living", "store"].sort(),
    );
    expect(plan.h).toBe(2.55);
    expect(plan.partitions).toHaveLength(6);
  });

  it("is a real HA 4–5 person shell, drawn 1.5× across", () => {
    expect(DREAM).toBe(1.5);
    const area = planArea(plan) / (DREAM * DREAM);
    expect(area).toBeGreaterThanOrEqual(35.0);
    expect(area).toBeLessThanOrEqual(36.1);
    expect(area / SQFT).toBeGreaterThan(370);
    expect(area / SQFT).toBeLessThan(390);
  });

  it("is wide-frontage, not a slot: one open room spans the window wall", () => {
    const living = plan.rooms.find((r) => r.id === "living")!;
    const store = plan.rooms.find((r) => r.id === "store")!;
    const b = planBoundsOf(plan);
    expect((b.x1 - b.x0) / DREAM).toBeCloseTo(6.9, 1);
    expect((b.z1 - b.z0) / DREAM).toBeCloseTo(5.2, 1);
    expect(living.w / DREAM).toBeCloseTo(6.9, 1);
    expect(living.d / DREAM).toBeCloseTo(3.2, 1);
    expect((living.w * living.d) / planArea(plan)).toBeGreaterThan(0.55);
    expect(store.w / DREAM).toBeCloseTo(0.8, 1);
    expect((store.w * store.d) / (DREAM * DREAM)).toBeLessThan(2);
  });

  it("wet rooms are usable: the kitchen fits a counter and its own door", () => {
    const kitchen = plan.rooms.find((r) => r.id === "kitchen")!;
    const bath = plan.rooms.find((r) => r.id === "bath")!;
    const entry = plan.rooms.find((r) => r.id === "entry")!;
    // 600 counter + a real aisle.
    expect(kitchen.w).toBeGreaterThan(1.7);
    expect(kitchen.w * kitchen.d).toBeGreaterThan(3.5);
    // Shower + basin + toilet, not a second living room.
    expect((bath.w * bath.d) / (DREAM * DREAM)).toBeGreaterThan(3);
    expect((bath.w * bath.d) / (DREAM * DREAM)).toBeLessThan(5.2);
    // Entry wide enough for the door leaf and a shoe cabinet beside it.
    expect(entry.w).toBeGreaterThan(1.5);
    // The kitchen door fits within the kitchen's own wall.
    const kPart = plan.partitions.find((p) => p.gaps?.length && p.axis === "x" && p.from < kitchen.x)!;
    const kDoor = kPart.gaps![0];
    expect(kDoor.at - kDoor.width / 2).toBeGreaterThanOrEqual(roomBounds(kitchen).x0 - 1e-9);
    expect(kDoor.at + kDoor.width / 2).toBeLessThanOrEqual(roomBounds(kitchen).x1 + 1e-9);
    // Door sits toward the entry, not in the middle of the counter.
    expect(kDoor.at).toBeGreaterThan(kitchen.x);
  });

  it("has windows: two on the living wall, service ones at the front", () => {
    const south = plan.windows.filter((w) => w.wall === "s").sort((a, b) => a.at - b.at);
    expect(south).toHaveLength(2);
    for (const w of south) {
      expect(w.width).toBeGreaterThan(1.2);
      expect(w.sill + w.height).toBeLessThan(plan.h - 0.2);
    }
    // Solid wall between them, wide enough for a future bedroom partition.
    const gap = (south[1].at - south[1].width / 2) - (south[0].at + south[0].width / 2);
    expect(gap).toBeGreaterThan(1);
    // Kitchen and bath each get a corridor-side window.
    const north = plan.windows.filter((w) => w.wall === "n");
    expect(north).toHaveLength(2);
    const kitchen = roomBounds(plan.rooms.find((r) => r.id === "kitchen")!);
    const bath = roomBounds(plan.rooms.find((r) => r.id === "bath")!);
    expect(north.some((w) => w.at >= kitchen.x0 && w.at <= kitchen.x1)).toBe(true);
    expect(north.some((w) => w.at >= bath.x0 && w.at <= bath.x1)).toBe(true);
    // The front door sits on the entry run, centred.
    const entry = plan.rooms.find((r) => r.id === "entry")!;
    expect(plan.entrance.x).toBeCloseTo(entry.x, 5);
    expect(plan.entrance.height).toBeLessThan(plan.h);
  });

  it("the entry is open to the living room; the store has a door", () => {
    const entry = roomBounds(plan.rooms.find((r) => r.id === "entry")!);
    const store = roomBounds(plan.rooms.find((r) => r.id === "store")!);
    const strip = plan.partitions.filter((p) => p.axis === "x");
    const crosses = (b: { x0: number; x1: number }) => strip.some((p) => Math.min(p.to, b.x1) - Math.max(p.from, b.x0) > 1e-6);
    expect(crosses(entry)).toBe(false);
    expect(crosses(store)).toBe(true);
  });

  it("rooms do not overlap in floor area", () => {
    for (let i = 0; i < plan.rooms.length; i++) {
      for (let j = i + 1; j < plan.rooms.length; j++) {
        const a = roomBounds(plan.rooms[i]), b = roomBounds(plan.rooms[j]);
        const overlapX = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const overlapZ = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
        // Shared walls may land slightly past zero after centering floats.
        expect(overlapX <= 1e-9 || overlapZ <= 1e-9, `${plan.rooms[i].id} vs ${plan.rooms[j].id}`).toBe(true);
      }
    }
  });

  it("buildShell cuts the door and windows out of the walls", () => {
    const { floors, walls } = buildShell(plan);
    expect(floors).toHaveLength(5);
    // Full-height pieces between openings, plus sills and heads: many segments, all shorter
    // than a solid wall run would be.
    expect(walls.length).toBeGreaterThan(20);
    const b = planBoundsOf(plan);
    // No wall piece covers the middle of either living-room window.
    for (const win of plan.windows.filter((w) => w.wall === "s")) {
      const covers = walls.some((w) =>
        Math.abs(w.z - b.z1) < 1e-6 &&
        w.x + w.sx / 2 > win.at - win.width / 4 && w.x - w.sx / 2 < win.at + win.width / 4 &&
        w.y + w.sy / 2 > win.sill + 0.2 && w.y - w.sy / 2 < win.sill + win.height - 0.2,
      );
      expect(covers, `wall across window at ${win.at}`).toBe(false);
    }
  });

  it("clampWalk lets you cross the open zones but not the kitchen wall", () => {
    const living = plan.rooms.find((r) => r.id === "living")!;
    const [x, z] = clampWalk(plan, living.x, living.z);
    expect(roomAt(plan, x, z)?.id).toBe("living");

    // From the living room, the entry is open and the store door lets you in.
    const entry = plan.rooms.find((r) => r.id === "entry")!;
    let px = entry.x, pz = roomBounds(entry).z1 + 0.2;
    for (let i = 0; i < 150; i++) [px, pz] = clampWalk(plan, px, pz - 0.02);
    expect(roomAt(plan, px, pz)?.id).toBe("entry");

    const store = plan.rooms.find((r) => r.id === "store")!;
    const storeDoor = doorsOf(plan).find((d) => Math.abs(d.x - store.x) < 0.3 && d.id !== "entrance")!;
    let ux = store.x, uz = roomBounds(store).z1 + 0.2;
    for (let i = 0; i < 150; i++) [ux, uz] = clampWalk(plan, ux, uz - 0.02);
    expect(roomAt(plan, ux, uz)?.id).not.toBe("store");

    ux = store.x; uz = roomBounds(store).z1 + 0.2;
    const open = { [storeDoor.id]: true };
    for (let i = 0; i < 150; i++) [ux, uz] = clampWalk(plan, ux, uz - 0.02, 0.22, open);
    expect(roomAt(plan, ux, uz)?.id).toBe("store");

    // A far-away point is pulled back inside the unit.
    const [bx, bz] = clampWalk(plan, 50, 50);
    const b = planBoundsOf(plan);
    expect(roomAt(plan, bx, bz)).toBeTruthy();
    expect(bx).toBeLessThanOrEqual(b.x1);
    expect(bz).toBeLessThanOrEqual(b.z1);
  });
});

describe("floor plan catalogue", () => {
  it("offers three distinct plans you can start from", () => {
    expect(FLOORPLANS.map((p) => p.id)).toEqual(["shimizu", "studio", "ldk"]);
    const ids = FLOORPLANS.map((p) => p.build().id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each plan tiles its footprint, keeps windows under the ceiling, and can be walked", () => {
    for (const choice of FLOORPLANS) {
      const plan = choice.build();
      expect(plan.id).toBe(choice.id);
      const b = planBoundsOf(plan);
      expect(planArea(plan)).toBeCloseTo(b.w * b.d, 2);
      for (let i = 0; i < plan.rooms.length; i++) {
        for (let j = i + 1; j < plan.rooms.length; j++) {
          const a = roomBounds(plan.rooms[i]), c = roomBounds(plan.rooms[j]);
          const overlapX = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0);
          const overlapZ = Math.min(a.z1, c.z1) - Math.max(a.z0, c.z0);
          expect(overlapX <= 1e-9 || overlapZ <= 1e-9, `${plan.id} ${plan.rooms[i].id} vs ${plan.rooms[j].id}`).toBe(true);
        }
      }
      for (const w of plan.windows) expect(w.sill + w.height).toBeLessThan(plan.h - 0.05);
      expect(plan.entrance.x).toBeGreaterThan(b.x0);
      expect(plan.entrance.x).toBeLessThan(b.x1);
      expect(plan.entrance.width).toBeCloseTo(0.8, 2);
      for (const p of plan.partitions) for (const g of p.gaps ?? []) {
        expect(g.width).toBeGreaterThan(0.6);
        expect(g.width).toBeLessThan(0.9);
      }
      const shell = buildShell(plan);
      expect(shell.floors.length).toBe(plan.rooms.length);
      expect(shell.walls.length).toBeGreaterThan(8);
      const living = plan.rooms.find((r) => r.id === "living")!;
      const [x, z] = clampWalk(plan, living.x, living.z);
      expect(pointInRoom(x, z, living)).toBe(true);
      if (plan.id === "ldk") expect(plan.rooms.find((r) => r.id === "bedroom")!.w).toBeGreaterThanOrEqual(3);
      if (plan.id === "studio") expect(plan.rooms.find((r) => r.id === "living")!.d).toBeGreaterThan(2);
    }
  });
});
