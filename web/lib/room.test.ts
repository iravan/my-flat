// Layout: untrusted poses are cleaned, and moving an item pivots about its own home, never the room's origin.
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { DREAM, FLOORPLANS } from "./flat-plan";
import { pieceHome } from "./frame";
import {
  addPiece, clampPiece, clearFurniture, defaultFlat, duplicatePiece, flatFromPlan, hiddenOf, itemMatrix,
  normalizeFlat, normalizeLayout, normalizeRoom, normalizeSize, persistFlat, placePoint, poseOf,
  removePiece, resetFlat, restPosition, setSwing, setWall, useLayout, HOMES, type Flat, type Piece,
} from "./room";

// The layout store saves to localStorage; tests get an in-memory one.
const mem = new Map<string, string>();
globalThis.localStorage ??= { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } as Storage;

describe("layout", () => {
  it("keeps good poses and clamps them inside the room", () => {
    const l = normalizeLayout({ bed: { position: [9, -1, 0.5], rotationY: 1, scale: 99 } });
    expect(l.bed).toEqual({ position: [2, 0, 0.5], rotationY: 1, scale: 4 });
  });

  it("drops junk: bad ids, missing or non-numeric positions, non-objects", () => {
    const l = normalizeLayout({ "../x": { position: [0, 0, 0] }, a: { position: [0, 0] }, b: "nope", c: { position: ["1", 0, 0] }, ok: { position: [0, 0, 0] } });
    expect(Object.keys(l)).toEqual(["c", "ok"]);
    expect(l.c.position).toEqual([0, 0, 0]); // non-numbers fall back, finite only
    expect(normalizeLayout(null)).toEqual({});
    expect(normalizeLayout([1, 2])).toEqual({});
  });

  it("is the identity at home and rotates about the item's own home point", () => {
    const home = { position: [-1.45, 0, -0.9] as [number, number, number] };
    expect(itemMatrix(home, undefined).equals(new THREE.Matrix4())).toBe(true);
    expect(itemMatrix(home, { position: home.position, rotationY: 0, scale: 1 }).equals(new THREE.Matrix4())).toBe(true);
    // turn the bed 90° in place: its home point stays put, a point 1 m toward +x ends up 1 m toward −z
    const m = itemMatrix(home, { position: home.position, rotationY: Math.PI / 2, scale: 1 });
    const p = new THREE.Vector3(...home.position).applyMatrix4(m);
    expect(p.distanceTo(new THREE.Vector3(...home.position))).toBeLessThan(1e-9);
    const q = new THREE.Vector3(-0.45, 0, -0.9).applyMatrix4(m);
    expect(q.distanceTo(new THREE.Vector3(-1.45, 0, -1.9))).toBeLessThan(1e-9);
  });

  it("respects a home yaw (the desk faces +x by default)", () => {
    const home = { position: [-1.68, 0, 1.35] as [number, number, number], rotationY: Math.PI / 2 };
    expect(itemMatrix(home, { position: home.position, rotationY: Math.PI / 2, scale: 1 }).equals(new THREE.Matrix4())).toBe(true);
  });

  it("keeps wall fixtures on their wall, facing the room, and the window inside the wall", () => {
    const l = normalizeLayout({
      window: { position: [3, 1.6, 0.5], rotationY: 1, scale: 1.5 },
      "socket-desk": { position: [0, 0.4, -1], rotationY: 2, scale: 1 },
      door: { position: [0.4, 0, -1], rotationY: 0, scale: 1 },
    });
    expect(l.window.position[2]).toBe(-2); // stays in the back wall
    expect(l.window.rotationY).toBe(0);
    expect(l.window.position[0]).toBeCloseTo(2 - 0.7 * 1.5 - 0.05); // opening stays inside the wall
    expect(l["socket-desk"].position).toEqual([-2, 0.4, -1]); // slides along the left wall
    expect(l["socket-desk"].rotationY).toBe(0);
    expect(l.door.position).toEqual([0.4, 0, 2]);
  });

  it("moves a cable end with the socket it plugs into, and leaves other ends alone", () => {
    const items = normalizeLayout({ "socket-desk": { position: [-2, 0.3, 0.2], rotationY: 0, scale: 1 } });
    const plug = placePoint("socket-desk", [-1.99, 0.3, 1.2], items); // plug end, modelled at the socket's home
    expect(plug.toArray().map((v) => +v.toFixed(6))).toEqual([-1.99, 0.3, 0.2]);
    const pc = placePoint("desk", [-1.92, 0.35, 0.95], items); // desk not moved
    expect(pc.toArray()).toEqual([-1.92, 0.35, 0.95]);
  });

  it("cleans replaced looks: built-in items only, stored model names only, quarter turns", () => {
    const r = normalizeRoom({ shells: {
      desk: { asset: "1234abcd.glb", name: "My desk", yaw: 1 },
      bed: { asset: "../../evil.glb", name: "x" },
      "model-12345678": { asset: "1234abcd.glb" },
      chair: { asset: "abcd1234.glb", yaw: 7 },
    } }, "visit:");
    expect(r.shells).toEqual({ desk: { asset: "visit:1234abcd.glb", name: "My desk", yaw: 1 }, chair: { asset: "visit:abcd1234.glb", name: "Model", yaw: 0 } });
  });

  it("bedroom normalizeSize still clamps; restPosition still follows walls", () => {
    expect(normalizeSize({ w: 99, d: "x", h: 1 })).toEqual({ w: 8, d: 4, h: 2.4 });
    const big = { w: 6, d: 5, h: 3.2 };
    expect(restPosition("bed", HOMES.bed, big)).toEqual([-2.45, 0, -1.4]);
    expect(restPosition("closet", HOMES.closet, big)).toEqual([0.1, 0, 2.5]);
  });

  it("add-then-undo removes the piece id", () => {
    useLayout.getState().resetFlatAction();
    const before = Object.keys(useLayout.getState().pieces);
    const id = useLayout.getState().addPieceAction("chair");
    expect(id).toBeTruthy();
    expect(useLayout.getState().pieces[id!]).toBeDefined();
    useLayout.getState().undo();
    expect(useLayout.getState().pieces[id!]).toBeUndefined();
    expect(Object.keys(useLayout.getState().pieces).sort()).toEqual(before.sort());
  });

  it("keeps a known style and falls back to the default for anything else", () => {
    expect(normalizeRoom({ style: "coastal" }).style).toBe("coastal");
    expect(normalizeRoom({ style: "<script>" }).style).toBe("shimizu");
    expect(normalizeRoom({}).style).toBe("shimizu");
  });

  it("an item standing on another follows it until moved itself", () => {
    const size = { w: 4, d: 4, h: 2.8 };
    expect(poseOf("lamp", HOMES.lamp, { items: {}, size }).position).toEqual([-1.7, 0.54, 0.45]);
    // nightstand moved 1 m right and turned 90°: the lamp (at the nightstand's centre) goes with it
    const items = { nightstand: { position: [-0.7, 0, 0.45] as [number, number, number], rotationY: Math.PI / 2, scale: 1 } };
    const p = poseOf("lamp", HOMES.lamp, { items, size });
    expect(p.position.map((v) => +v.toFixed(6))).toEqual([-0.7, 0.54, 0.45]);
    expect(p.rotationY).toBeCloseTo(Math.PI / 2);
    // moved itself: stays put
    const own = { position: [0, 0.75, 1] as [number, number, number], rotationY: 0, scale: 1 };
    expect(poseOf("lamp", HOMES.lamp, { items: { ...items, lamp: own }, size })).toBe(own);
    // hides with it, unless moved off it
    expect(hiddenOf("monitor", { items: {}, hidden: ["desk"] })).toBe(true);
    expect(hiddenOf("monitor", { items: { monitor: own }, hidden: ["desk"] })).toBe(false);
    expect(hiddenOf("pc", { items: {}, hidden: ["desk"] })).toBe(false);
  });

  it("picking a look on a piece: saved by piece id via kind", () => {
    const L = useLayout.getState;
    L().resetFlatAction();
    const id = L().addPieceAction("rug");
    expect(id).toBeTruthy();
    const before = L().past.length;
    L().setLook(id!, "braided");
    expect(L().options[id!].look).toBe("braided");
    expect(L().past.length).toBe(before + 1);
    L().setLook(id!, "canopy");
    expect(L().options[id!]?.look).toBe("braided"); // invalid look ignored; previous kept via merge of normalize
  });

  it("a point on rolled clutter standing on an item goes where that item goes", () => {
    const size = { w: 4, d: 4, h: 2.8 }, items = { bed: { position: [-0.45, 0, -0.9] as [number, number, number], rotationY: 0, scale: 1 } };
    // the phone has no fixed home and isn't drawn in a test: its charger plug follows the bed, 1 m right
    expect(placePoint("phone", [-1.5, 0.55, 1], items, undefined, size).toArray().map((v) => +v.toFixed(6))).toEqual([-0.5, 0.55, 1]);
  });
});

describe("flat", () => {
  const pose = (p: [number, number, number], yaw = 0, scale = 1) => ({ position: p, rotationY: yaw, scale });

  it("pieceHome: chair and ceiling-light are the origin; desk keeps HOMES.desk", () => {
    expect(pieceHome("chair")).toEqual({ position: [0, 0, 0] });
    expect(pieceHome("ceiling-light")).toEqual({ position: [0, 0, 0] });
    expect(pieceHome("desk")).toEqual(HOMES.desk);
    expect(itemMatrix(pieceHome("chair")!, pose([1, 0, 2])).elements[12]).toBeCloseTo(1);
    expect(itemMatrix(pieceHome("chair")!, pose([1, 0, 2])).elements[14]).toBeCloseTo(2);
    const deskHome = pieceHome("desk")!;
    const m = itemMatrix(deskHome, pose(deskHome.position as [number, number, number], deskHome.rotationY ?? 0));
    expect(new THREE.Vector3(...deskHome.position).applyMatrix4(m).distanceTo(new THREE.Vector3(...deskHome.position))).toBeLessThan(1e-9);
  });

  it("persistFlat keeps pieces and name and drops hidden", () => {
    const raw = {
      name: "Studio", style: "scandinavian" as const, size: { w: 4, d: 4.5, h: 2.6 },
      plan: defaultFlat().plan,
      pieces: { "p-00000003": { kind: "ceiling-light" } },
      items: { "p-00000003": pose([0, 2.485, 0]) },
      options: {}, models: {}, shells: {},
      hidden: ["bed"],
    };
    const f = persistFlat(raw);
    expect(f.name).toBe("Studio");
    expect(f.pieces["p-00000003"].kind).toBe("ceiling-light");
    expect("hidden" in f).toBe(false);
  });

  it("normalizeFlat: options by kind, one opening per wall, models outside the 80 cap", () => {
    const f = normalizeFlat({
      name: "Room", style: "scandinavian", size: { w: 4, d: 4.5, h: 2.6 },
      pieces: {
        "p-00000001": { kind: "door", wall: "e" },
        "p-00000002": { kind: "door", wall: "e" }, // same wall: higher id dropped
        "p-aaaaaaaa": { kind: "bed" },
      },
      items: {
        "p-00000001": pose([2, 0, 0]),
        "p-00000002": pose([2, 0, 0]),
        "p-aaaaaaaa": pose([0, 0, 0]),
        "model-abcd1234": pose([1, 0, 1]),
      },
      models: { "model-abcd1234": { asset: "abcd1234.glb", name: "Sofa" } },
      options: { "p-aaaaaaaa": { look: "spindle-pine", size: "double", wood: "pine" } },
    });
    expect(f.pieces["p-00000002"]).toBeUndefined();
    expect(f.pieces["p-00000001"]?.wall).toBe("e");
    expect(f.models["model-abcd1234"]).toBeDefined();
    expect(f.options["p-aaaaaaaa"]).toEqual({ look: "spindle-pine", size: "double", wood: "pine" });
  });

  it("normalizeFlat keeps at most 80 pieces; models do not count", () => {
    const pieces: Record<string, Piece> = {};
    const items: Record<string, ReturnType<typeof pose>> = {};
    for (let i = 0; i < 90; i++) {
      const id = `p-${i.toString(16).padStart(8, "0")}`;
      pieces[id] = { kind: "chair" };
      items[id] = pose([0, 0, 0]);
    }
    for (let i = 0; i < 5; i++) {
      const id = `model-${i.toString(16).padStart(8, "0")}`;
      items[id] = pose([0, 0, 0]);
    }
    const models = Object.fromEntries(
      [0, 1, 2, 3, 4].map((i) => [`model-${i.toString(16).padStart(8, "0")}`, { asset: `${i.toString(16).padStart(8, "0")}.glb`, name: "M" }]),
    );
    const f = normalizeFlat({ pieces, items, models, style: "scandinavian", name: "Room", size: { w: 4, d: 4.5, h: 2.6 } });
    expect(Object.keys(f.pieces).length).toBe(80);
    expect(Object.keys(f.models).length).toBe(5);
  });

  it("window on the east wall is yaw −π/2 at y 1.55; door on east is +π/2", () => {
    const win = normalizeFlat({
      pieces: { "p-0000000a": { kind: "window", wall: "e" } },
      items: { "p-0000000a": pose([0, 1.55, 0]) },
      style: "scandinavian", name: "Room",
    });
    expect(win.items["p-0000000a"].position[0]).toBe(win.size.w / 2);
    expect(win.items["p-0000000a"].position[1]).toBeCloseTo(1.55);
    expect(win.items["p-0000000a"].rotationY).toBeCloseTo(-Math.PI / 2);
    const door = normalizeFlat({
      pieces: { "p-0000000b": { kind: "door", wall: "e" } },
      items: { "p-0000000b": pose([0, 0, 0]) },
      style: "scandinavian", name: "Room",
    });
    expect(door.items["p-0000000b"].rotationY).toBeCloseTo(Math.PI / 2);
  });

  it("a centred bed does not jump when the room grows (no bedroom wall anchor)", () => {
    const piece: Piece = { kind: "bed" };
    const small = { w: 4, d: 4.5, h: 2.6 }, big = { w: 5, d: 4.5, h: 2.6 };
    const at = pose([0, 0, 0]);
    const a = clampPiece("bed", piece, at, small);
    const b = clampPiece("bed", piece, a, big);
    expect(b.position[0]).toBe(0);
    expect(b.position[2]).toBe(0);
  });

  it("defaultFlat is the bare 清水樓 shell", () => {
    const f = defaultFlat();
    expect(f.plan.name).toBe("清水樓");
    expect(f.plan.rooms.map((r) => r.id).sort()).toEqual(
      ["bath", "entry", "kitchen", "living", "store"].sort(),
    );
    expect(f.plan.partitions).toHaveLength(6);
    expect(f.plan.windows).toHaveLength(4);
    expect(f.size.w / DREAM).toBeCloseTo(6.9, 1);
    expect(f.size.d / DREAM).toBeCloseTo(5.2, 1);
    expect(f.items["p-00000003"].position[0]).toBeCloseTo(f.plan.rooms.find((r) => r.id === "living")!.x);
  });

  it("flatFromPlan starts each catalogue plan as an empty shell", () => {
    for (const choice of FLOORPLANS) {
      const f = flatFromPlan(choice.build(), choice.style);
      expect(f.plan.id).toBe(choice.id);
      expect(f.name).toBe(f.plan.name);
      expect(f.style).toBe(choice.style);
      expect(Object.keys(f.pieces)).toEqual(["p-00000003"]);
      expect(f.size.h).toBe(f.plan.h);
    }
  });

  it("a saved plan without an id is still the 清水樓", () => {
    const plan = defaultFlat().plan;
    const { id: _id, ...legacy } = plan;
    const f = normalizeFlat({ ...defaultFlat(), plan: legacy });
    expect(f.plan.id).toBe("shimizu");
    expect(f.plan.rooms.map((r) => r.id).sort()).toEqual(plan.rooms.map((r) => r.id).sort());
  });

  it("addPiece / duplicate / remove / wall / swing / clear / reset", () => {
    let f = defaultFlat();
    const cam = { roomPos: [0, 1.55, 0] as [number, number, number], yawDeg: 0 };
    const bed = addPiece(f, "bed", cam);
    expect(bed.id).toMatch(/^p-[0-9a-f]{8}$/);
    expect(bed.flat.options[bed.id!]?.look).toBe("spindle-pine");
    f = bed.flat;
    const chair = addPiece(f, "chair", cam);
    expect(chair.flat.items[chair.id!].rotationY).toBeCloseTo(0); // same camera-facing formula as addModelFile
    f = chair.flat;
    const dup = duplicatePiece(f, bed.id!);
    expect(dup.id).toBeTruthy();
    expect(dup.flat.items[dup.id!].position[0]).toBeCloseTo(f.items[bed.id!].position[0] + 0.4);
    f = removePiece(dup.flat, dup.id!);
    expect(f.pieces[dup.id!]).toBeUndefined();

    const door = addPiece(f, "door", cam);
    f = door.flat;
    f = setWall(f, door.id!, "w");
    expect(f.pieces[door.id!].wall).toBe("w");
    expect(f.items[door.id!].rotationY).toBeCloseTo(-Math.PI / 2);
    f = setSwing(f, door.id!, "l");
    expect(f.pieces[door.id!].swing).toBe("l");

    f = clearFurniture(f);
    expect(Object.values(f.pieces).every((p) => ["door", "window", "ceiling-light"].includes(p.kind))).toBe(true);
    expect(f.pieces[door.id!]).toBeDefined();
    expect(f.pieces[bed.id!]).toBeUndefined();

    f = resetFlat(f);
    expect(Object.keys(f.pieces)).toEqual(["p-00000003"]);
  });
});
