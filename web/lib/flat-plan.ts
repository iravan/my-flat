// Axis-aligned multi-room floor plan. Metres, three.js xz (+x east, −z north).

export type RoomRect = {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
};

/** Which perimeter wall a window sits in. */
export type WallSide = "n" | "e" | "s" | "w";

/** A window: `at` is the centre along the wall (x on n/s walls, z on e/w), sill and height in metres. */
export type PlanWindow = { wall: WallSide; at: number; width: number; sill: number; height: number };

/**
 * An interior wall. `axis: "x"` runs east–west at constant z (`fixed`); `axis: "z"` runs
 * north–south at constant x. `from`/`to` are along the run. Gaps are doorways (0…2.05 m),
 * centred at `at` and `width` wide. In an open-plan unit most zone boundaries have no wall.
 */
export type Partition = {
  axis: "x" | "z";
  fixed: number;
  from: number;
  to: number;
  gaps?: { at: number; width: number }[];
};

export type FlatPlan = {
  id: string;
  name: string;
  h: number;
  rooms: RoomRect[];
  partitions: Partition[];
  windows: PlanWindow[];
  /** The front door: a hole in the north (−z) perimeter wall, leaf rendered by the shell. */
  entrance: { x: number; width: number; height: number };
};

function room(id: string, name: string, x0: number, x1: number, z0: number, z1: number): RoomRect {
  return { id, name, x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
}

/** Square feet → square metres, for reading Hong Kong unit sizes. */
export const SQFT = 0.092903;
const WALL_T = 0.1;
const DOOR_H = 2.05;

export function planArea(plan: FlatPlan): number {
  return plan.rooms.reduce((s, r) => s + r.w * r.d, 0);
}

/**
 * 清水樓 — a bare shell unit as handed over by the Hong Kong Housing Authority
 * (構件式單位, 4–5 person: internal floor area 35.0–36.1 m² ≈ 377–388 sq ft).
 *
 * Wide frontage, not a slot: 6.9 m across the window wall × 5.2 m deep, clear ceiling
 * 2.55 m. The service strip sits by the entrance. Only the kitchen and the bath are
 * walled. The washer is a 1.0 m niche, open to the living room, not a second room.
 * The window wall has two openings, so a later bedroom wall between them still gets light.
 *
 *   north (−z), corridor, front door
 *   ┌──────────┬───────┬──────────┬───┐
 *   │ Kitchen  │ Entry │   Bath   │ W │  W = 1.0 m washer niche, open below
 *   │  door↓   │(open) │  door↓   │   │
 *   ├──────────┴───────┴──────────┴───┤
 *   │     Living          Bedroom bay │  one room until you build the wall
 *   └════ window ═══════ window ══════┘
 *   south (+z), view
 */
export function shimizu(): FlatPlan {
  const W = 6.9, D = 5.2, wet = 2.2;
  const kX1 = 2.4;          // kitchen: 600 counter + aisle
  const eX1 = 3.7;          // entry: door swing plus a shoe cabinet
  const bX1 = 5.9;          // bath: shower, basin, toilet
  // washer niche takes the last 1.0 m

  const raw: FlatPlan = {
    id: "shimizu",
    name: "清水樓",
    h: 2.55,
    rooms: [
      room("kitchen", "Kitchen", 0, kX1, 0, wet),
      room("entry", "Entry", kX1, eX1, 0, wet),
      room("bath", "Bath", eX1, bX1, 0, wet),
      room("utility", "Washer", bX1, W, 0, wet),
      room("living", "Living · Dining", 0, W, wet, D),
    ],
    partitions: [
      // Kitchen: its own box, door on the living side.
      { axis: "z", fixed: kX1, from: 0, to: wet },
      { axis: "x", fixed: wet, from: 0, to: kX1, gaps: [{ at: kX1 / 2, width: 0.75 }] },
      // Bath: its own box, door on the living side.
      { axis: "z", fixed: eX1, from: 0, to: wet },
      { axis: "x", fixed: wet, from: eX1, to: bX1, gaps: [{ at: (eX1 + bX1) / 2, width: 0.7 }] },
      // Washer niche: one wall against the bath, open to the living room.
      { axis: "z", fixed: bX1, from: 0, to: wet },
    ],
    windows: [
      // Two openings on the view wall, with a stretch of solid wall between them
      // so a bedroom partition can land there and both rooms still have a window.
      { wall: "s", at: 1.35, width: 1.5, sill: 0.9, height: 1.35 },
      { wall: "s", at: 5.15, width: 1.4, sill: 0.9, height: 1.35 },
      // Kitchen and bath windows onto the corridor / air well.
      { wall: "n", at: kX1 / 2, width: 0.6, sill: 1.1, height: 0.6 },
      { wall: "n", at: (eX1 + bX1) / 2, width: 0.5, sill: 1.3, height: 0.5 },
    ],
    // Front door: 800 mm clear (HA widened it from 750 mm), centred on the entry run.
    entrance: { x: (kX1 + eX1) / 2, width: 0.8, height: DOOR_H },
  };
  return place(raw);
}

/**
 * 清水樓, 1–2 person. About 14.6 m² (≈157 sq ft): a walled bath, an open kitchen,
 * and one room for living and sleeping. The front door opens into the kitchen.
 */
export function studio(): FlatPlan {
  const W = 3.4, D = 4.3, wet = 1.8, kX1 = 1.8;
  return place({
    id: "studio",
    name: "清水樓 · 一人",
    h: 2.55,
    rooms: [
      room("kitchen", "Kitchen", 0, kX1, 0, wet),
      room("bath", "Bath", kX1, W, 0, wet),
      room("living", "Living", 0, W, wet, D),
    ],
    partitions: [
      { axis: "z", fixed: kX1, from: 0, to: wet },
      { axis: "x", fixed: wet, from: kX1, to: W, gaps: [{ at: (kX1 + W) / 2, width: 0.7 }] },
    ],
    windows: [
      { wall: "s", at: W / 2, width: 1.4, sill: 0.9, height: 1.35 },
      { wall: "n", at: (kX1 + W) / 2, width: 0.45, sill: 1.35, height: 0.45 },
    ],
    entrance: { x: kX1 / 2, width: 0.8, height: DOOR_H },
  });
}

/**
 * A Japanese 1LDK, about 40 m². Service rooms line the corridor side. The kitchen
 * is open to the living room; the bedroom has a door. Toilet, washroom, and bath
 * are separate, which is the usual arrangement.
 */
export function japanese1Ldk(): FlatPlan {
  const W = 7.4, wet = 1.8, D = 5.4;
  const gX1 = 1.6, tX1 = 2.6, wX1 = 4.2, bX1 = 5.8;
  const kX1 = 2.2, lX1 = 5.2;
  return place({
    id: "ldk",
    name: "1LDK",
    h: 2.4,
    rooms: [
      room("genkan", "Genkan", 0, gX1, 0, wet),
      room("toilet", "Toilet", gX1, tX1, 0, wet),
      room("wash", "Washroom", tX1, wX1, 0, wet),
      room("bath", "Bath", wX1, bX1, 0, wet),
      room("closet", "Closet", bX1, W, 0, wet),
      room("kitchen", "Kitchen", 0, kX1, wet, D),
      room("living", "Living", kX1, lX1, wet, D),
      room("bedroom", "Bedroom", lX1, W, wet, D),
    ],
    partitions: [
      { axis: "z", fixed: gX1, from: 0, to: wet },
      { axis: "z", fixed: tX1, from: 0, to: wet },
      { axis: "x", fixed: wet, from: gX1, to: tX1, gaps: [{ at: (gX1 + tX1) / 2, width: 0.65 }] },
      { axis: "z", fixed: wX1, from: 0, to: wet, gaps: [{ at: wet / 2, width: 0.65 }] },
      { axis: "x", fixed: wet, from: tX1, to: wX1, gaps: [{ at: (tX1 + wX1) / 2, width: 0.7 }] },
      { axis: "z", fixed: bX1, from: 0, to: wet },
      { axis: "x", fixed: wet, from: wX1, to: bX1 },
      { axis: "x", fixed: wet, from: bX1, to: W, gaps: [{ at: (bX1 + W) / 2, width: 0.7 }] },
      { axis: "z", fixed: lX1, from: wet, to: D, gaps: [{ at: (wet + D) / 2, width: 0.75 }] },
    ],
    windows: [
      { wall: "s", at: (kX1 + lX1) / 2, width: 1.8, sill: 0.85, height: 1.3 },
      { wall: "s", at: (lX1 + W) / 2, width: 1.2, sill: 0.85, height: 1.3 },
      { wall: "w", at: (wet + D) / 2, width: 1.1, sill: 0.9, height: 1.1 },
      { wall: "n", at: (wX1 + bX1) / 2, width: 0.45, sill: 1.4, height: 0.45 },
    ],
    entrance: { x: gX1 / 2, width: 0.8, height: DOOR_H },
  });
}

/** Shift a plan drawn from (0, 0) so it is centred on the origin. */
function place(raw: FlatPlan): FlatPlan {
  const b = planBounds(raw);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  return {
    ...raw,
    rooms: raw.rooms.map((r) => ({ ...r, x: r.x - cx, z: r.z - cz })),
    partitions: raw.partitions.map((p) => ({
      ...p,
      fixed: p.axis === "x" ? p.fixed - cz : p.fixed - cx,
      from: p.axis === "x" ? p.from - cx : p.from - cz,
      to: p.axis === "x" ? p.to - cx : p.to - cz,
      gaps: p.gaps?.map((g) => ({ ...g, at: p.axis === "x" ? g.at - cx : g.at - cz })),
    })),
    windows: raw.windows.map((w) => ({ ...w, at: w.wall === "n" || w.wall === "s" ? w.at - cx : w.at - cz })),
    entrance: { ...raw.entrance, x: raw.entrance.x - cx },
  };
}

export type FloorplanChoice = {
  id: string;
  title: string;
  blurb: string;
  area: string;
  style: string;
  build: () => FlatPlan;
};

/** The plans offered on the start screen. */
export const FLOORPLANS: FloorplanChoice[] = [
  {
    id: "shimizu",
    title: "清水樓 · 四人",
    blurb: "Bare shell, 6.9 × 5.2 m. Kitchen and bath walled, a washer niche, two windows on the view wall.",
    area: "36 m²",
    style: "shimizu",
    build: shimizu,
  },
  {
    id: "studio",
    title: "清水樓 · 一人",
    blurb: "Small bare shell, 3.4 × 4.3 m. Bath walled, kitchen open onto the room, one window.",
    area: "15 m²",
    style: "shimizu",
    build: studio,
  },
  {
    id: "ldk",
    title: "日本 1LDK",
    blurb: "About 40 m². Genkan, kitchen open to living, bedroom, toilet, washroom, bath, and closet.",
    area: "40 m²",
    style: "japandi",
    build: japanese1Ldk,
  },
];

export function floorplanById(id: string): FloorplanChoice | undefined {
  return FLOORPLANS.find((p) => p.id === id);
}

/** Eye height in the living room, facing the window wall. */
export function livingSpawn(plan: FlatPlan): { roomPos: [number, number, number]; yaw: number } {
  const r = plan.rooms.find((x) => x.id === "living") ?? plan.rooms[0];
  return { roomPos: [r.x, 1.5, r.z], yaw: 180 };
}

export function roomBounds(r: RoomRect) {
  return { x0: r.x - r.w / 2, x1: r.x + r.w / 2, z0: r.z - r.d / 2, z1: r.z + r.d / 2 };
}

export function pointInRoom(x: number, z: number, r: RoomRect, margin = 0) {
  const b = roomBounds(r);
  return x >= b.x0 + margin && x <= b.x1 - margin && z >= b.z0 + margin && z <= b.z1 - margin;
}

export function roomAt(plan: FlatPlan, x: number, z: number, margin = 0): RoomRect | undefined {
  return plan.rooms.find((r) => pointInRoom(x, z, r, margin));
}

export function planBounds(plan: FlatPlan) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const r of plan.rooms) {
    const b = roomBounds(r);
    x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1);
    z0 = Math.min(z0, b.z0); z1 = Math.max(z1, b.z1);
  }
  return { x0, x1, z0, z1, w: x1 - x0, d: z1 - z0 };
}

export type WallSeg = { x: number; y: number; z: number; sx: number; sy: number; sz: number };

type Hole = { at: number; width: number; y0: number; y1: number };

/** A wall run split around holes: full-height between holes, sill-to-head skipped, above/below kept. */
function wallPieces(axis: "x" | "z", fixed: number, from: number, to: number, h: number, holes: Hole[]): WallSeg[] {
  const out: WallSeg[] = [];
  const gaps = holes.map((ho) => [ho.at - ho.width / 2, ho.at + ho.width / 2] as [number, number]);
  const push = (a0: number, a1: number, y0: number, y1: number) => {
    const len = a1 - a0, sy = y1 - y0;
    if (len < 0.05 || sy < 0.05) return;
    const mid = (a0 + a1) / 2, y = (y0 + y1) / 2 - 0.05;
    if (axis === "x") out.push({ x: mid, y, z: fixed, sx: len, sy, sz: WALL_T });
    else out.push({ x: fixed, y, z: mid, sx: WALL_T, sy, sz: len });
  };
  for (const [a0, a1] of subtractGaps(from, to, gaps)) push(a0, a1, 0, h);
  for (const ho of holes) {
    const g0 = ho.at - ho.width / 2, g1 = ho.at + ho.width / 2;
    push(g0, g1, 0, ho.y0);       // under the sill
    push(g0, g1, ho.y1, h);       // over the head
  }
  return out;
}

/** Interior partitions: door gaps run 0…2.05 m with wall above. */
function partitionWalls(plan: FlatPlan): WallSeg[] {
  const out: WallSeg[] = [];
  for (const p of plan.partitions) {
    const holes = (p.gaps ?? []).map((g) => ({ at: g.at, width: g.width, y0: 0, y1: DOOR_H }));
    out.push(...wallPieces(p.axis, p.fixed, p.from, p.to, plan.h, holes));
  }
  return out;
}

/** The four outside walls, with the front door and every window cut in. */
function perimeterWalls(plan: FlatPlan): WallSeg[] {
  const b = planBounds(plan);
  const h = plan.h;
  const on = (side: WallSide) =>
    plan.windows.filter((w) => w.wall === side).map((w) => ({ at: w.at, width: w.width, y0: w.sill, y1: w.sill + w.height }));
  const door = [{ at: plan.entrance.x, width: plan.entrance.width, y0: 0, y1: plan.entrance.height }];

  return [
    ...wallPieces("x", b.z0, b.x0, b.x1, h, [...door, ...on("n")]),
    ...wallPieces("x", b.z1, b.x0, b.x1, h, on("s")),
    ...wallPieces("z", b.x0, b.z0, b.z1, h, on("w")),
    ...wallPieces("z", b.x1, b.z0, b.z1, h, on("e")),
  ];
}

export function buildShell(plan: FlatPlan): { floors: RoomRect[]; walls: WallSeg[]; ceilings: RoomRect[] } {
  return {
    floors: plan.rooms,
    ceilings: plan.rooms,
    walls: [...perimeterWalls(plan), ...partitionWalls(plan)],
  };
}

function subtractGaps(a0: number, a1: number, gaps: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[a0, a1]];
  for (const [g0, g1] of gaps) {
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (g1 <= p0 || g0 >= p1) { next.push([p0, p1]); continue; }
      if (g0 > p0) next.push([p0, Math.max(p0, g0)]);
      if (g1 < p1) next.push([Math.min(p1, g1), p1]);
    }
    parts = next;
  }
  return parts;
}

/**
 * Nearest position the camera may occupy: inside the unit, and not inside a partition
 * unless standing in its doorway. Free movement between open zones is expected — only
 * the kitchen and bath walls, and the exterior, stop you.
 */
export function clampWalk(plan: FlatPlan, x: number, z: number, margin = 0.22): [number, number] {
  const b = planBounds(plan);
  let px = Math.min(b.x1 - margin, Math.max(b.x0 + margin, x));
  let pz = Math.min(b.z1 - margin, Math.max(b.z0 + margin, z));

  const half = WALL_T / 2 + margin;
  for (const p of plan.partitions) {
    const across = p.axis === "x" ? pz - p.fixed : px - p.fixed;
    const along = p.axis === "x" ? px : pz;
    if (Math.abs(across) >= half) continue;
    if (along < p.from - half || along > p.to + half) continue;
    const inGap = (p.gaps ?? []).some((g) => Math.abs(along - g.at) <= g.width / 2 - margin * 0.5);
    if (inGap) continue;
    // Push out to the side we're already on (steps are ~2 cm, so this never jumps a wall).
    const side = across >= 0 ? 1 : -1;
    if (p.axis === "x") pz = p.fixed + side * half;
    else px = p.fixed + side * half;
  }
  return [px, pz];
}
