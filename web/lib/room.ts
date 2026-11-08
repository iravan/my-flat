import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as THREE from "three";
import { useGame, type Vec3 } from "./store";
import { ITEMS } from "@/items/registry";
import { normalizeOptions, type Options } from "./options";
import { DEFAULT_STYLE, STYLES, styleOf, type Style, type StyleId } from "./styles";
import { pieceHome } from "./frame";
import { catalogueEntry, catalogueKind, UI_PIECE_CAP } from "./catalogue";
import { itemDefaults } from "./config";
import { floorplanById, livingSpawn, planBounds, shimizu, type FlatPlan } from "./flat-plan";

// The room as data. Every item renders through <RoomItem id home>: its children are modelled in place at `home`
// (the default room), and a saved pose moves the whole item rigidly about that home point. Only moved items are
// stored, so the default room is an empty layout. Poses are three.js world space; rotationY in radians.
export type Pose = { position: Vec3; rotationY: number; scale: number };
export type Home = { position: Vec3; rotationY?: number };
export type Layout = Record<string, Pose>;

// Room size: width (x), depth (z), height. The default room is 4 × 4 × 2.8 m, centred on x/z, floor at y 0.
export type RoomSize = { w: number; d: number; h: number };
export const DEFAULT_SIZE: RoomSize = { w: 4, d: 4, h: 2.8 };
export const SIZE_RANGE: Record<keyof RoomSize, [number, number]> = { w: [3, 8], d: [3, 8], h: [2.4, 4] };
export function normalizeSize(raw: unknown): RoomSize {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const one = (k: keyof RoomSize) => {
    const [lo, hi] = SIZE_RANGE[k], v = r[k];
    return typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100 : DEFAULT_SIZE[k];
  };
  return { w: one("w"), d: one("d"), h: one("h") };
}

// Which walls an item stands against (−1 = left/back, +1 = right/front); it follows them when the room is resized,
// so a bed against the back wall stays against it. Items not listed follow a wall if they're within 0.5 m of it.
// Walls each item follows (from its definition in items/<id>/item.ts).
const ANCHOR: Record<string, { x?: -1 | 1; z?: -1 | 1 }> = Object.fromEntries(
  Object.values(ITEMS).filter((d) => d.walls).map((d) => [d.id, d.walls!]),
);
function anchorOf(id: string, p: Vec3, size: RoomSize) {
  const a = ANCHOR[id];
  if (a) return { x: a.x ?? 0, z: a.z ?? 0 };
  const near = (v: number, half: number) => (v < -half + 0.5 ? -1 : v > half - 0.5 ? 1 : 0);
  return { x: near(p[0], size.w / 2), z: near(p[2], size.d / 2) };
}
// Where an item rests when it hasn't been moved: its home, carried along with the walls it stands against.
export function restPosition(id: string, home: Home, size: RoomSize): Vec3 {
  const a = anchorOf(id, home.position, DEFAULT_SIZE);
  return [home.position[0] + (a.x * (size.w - DEFAULT_SIZE.w)) / 2, home.position[1], home.position[2] + (a.z * (size.d - DEFAULT_SIZE.d)) / 2];
}
export const restPose = (id: string, home: Home, size: RoomSize): Pose => ({ position: restPosition(id, home, size), rotationY: home.rotationY ?? 0, scale: 1 });

// Fixed homes of the furniture that other code also needs (camera shots); clutter homes are rolled per load.
// Fixed homes (from the item definitions); clutter homes are rolled per load and registered by <RoomItem>.
export const HOMES: Record<string, Home> = Object.fromEntries(
  Object.values(ITEMS).filter((d) => d.home).map((d) => [d.id, d.home!]),
);

// Wall fixtures slide along their wall: the coordinate across the wall and the facing stay as at home.
export const ON_WALL: Record<string, "x" | "z"> = Object.fromEntries(
  Object.values(ITEMS).filter((d) => d.onWall).map((d) => [d.id, d.onWall!]),
);
// Window: its opening (1.4 × 1 m at scale 1) must stay inside the wall.
export const WINDOW_SIZE = { w: 1.4, h: 1 };
function constrain(id: string, p: Pose, size: RoomSize): Pose {
  const axis = ON_WALL[id], home = HOMES[id];
  if (!axis || !home) return p;
  const position: Vec3 = [...p.position], i = axis === "x" ? 0 : 2;
  position[i] = restPosition(id, home, size)[i];
  if (id === "window") {
    const hw = (WINDOW_SIZE.w * p.scale) / 2 + 0.05, hh = (WINDOW_SIZE.h * p.scale) / 2 + 0.05;
    position[0] = Math.min(size.w / 2 - hw, Math.max(-size.w / 2 + hw, position[0]));
    position[1] = Math.min(size.h - 0.1 - hh, Math.max(0.1 + hh, position[1]));
  }
  return { position, rotationY: home.rotationY ?? 0, scale: id === "window" ? Math.min(p.scale, 1.8) : p.scale };
}

const finite = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

// Untrusted layout (save, share file, a friend's room) → clean poses inside the room. Bad entries are dropped.
export function normalizeLayout(raw: unknown, size: RoomSize = DEFAULT_SIZE): Layout {
  const out: Layout = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, p] of Object.entries(raw as Record<string, unknown>).slice(0, 500)) {
    if (!/^[\w-]{1,64}$/.test(id) || !p || typeof p !== "object") continue;
    const q = p as Record<string, unknown>, pos = Array.isArray(q.position) ? q.position : [];
    if (pos.length !== 3) continue;
    out[id] = constrain(id, {
      position: [finite(pos[0], -size.w / 2, size.w / 2, 0), finite(pos[1], 0, size.h, 0), finite(pos[2], -size.d / 2, size.d / 2, 0)],
      rotationY: finite(q.rotationY, -1e3, 1e3, 0) % (2 * Math.PI),
      scale: finite(q.scale, 0.25, 4, 1),
    }, size);
  }
  return out;
}

// Homes of the items currently rendered (clutter homes are rolled per load), registered by <RoomItem>.
export const liveHomes = new Map<string, Home>();



// Uploaded models placed in the room: instance id → stored file (IndexedDB) and its original file name.
export type Models = Record<string, { asset: string; name: string }>;
export function normalizeModels(raw: unknown): Models {
  const out: Models = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, m] of Object.entries(raw as Record<string, unknown>).slice(0, 200)) {
    const v = m as { asset?: unknown; name?: unknown };
    if (/^model-[0-9a-f]{8}$/.test(id) && typeof v?.asset === "string" && /^(visit:)?[0-9a-f]{8}\.glb$/.test(v.asset))
      out[id] = { asset: v.asset, name: typeof v.name === "string" ? v.name.slice(0, 60) : "Model" };
  }
  return out;
}

// While visiting a friend's room their layout is shown in this store; nothing may be written to your save.
let frozen = false;
export const freezeLayoutSaves = (on: boolean) => { frozen = on; };
const storage = createJSONStorage(() => ({
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => { if (!frozen) localStorage.setItem(k, v); },
  removeItem: (k: string) => { if (!frozen) localStorage.removeItem(k); },
}));

// Built-in items whose look is replaced by an uploaded model: item id → model file, name, and a quarter-turn yaw.
export type Shells = Record<string, { asset: string; name: string; yaw: number }>;
export function normalizeShells(raw: unknown): Shells {
  const out: Shells = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, m] of Object.entries(raw as Record<string, unknown>).slice(0, 200)) {
    const v = m as { asset?: unknown; name?: unknown; yaw?: unknown };
    if (/^[\w-]{1,64}$/.test(id) && !id.startsWith("model-") && typeof v?.asset === "string" && /^(visit:)?[0-9a-f]{8}\.glb$/.test(v.asset))
      out[id] = { asset: v.asset, name: typeof v.name === "string" ? v.name.slice(0, 60) : "Model", yaw: [0, 1, 2, 3].includes(v.yaw as number) ? (v.yaw as number) : 0 };
  }
  return out;
}

// Hidden items (any item id, built-in or uploaded).
export function normalizeHidden(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string => typeof id === "string" && /^[\w-]{1,64}$/.test(id)))].slice(0, 500).sort();
}

export type RoomData = { hidden: string[]; style: StyleId; size: RoomSize; items: Layout; options: Options; models: Models; shells: Shells };
// Untrusted room layout (a share file): every part cleaned; model files optionally renamed (visit: prefix).
export function normalizeRoom(raw: unknown, assetPrefix = ""): RoomData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const models = normalizeModels(r.models);
  const shells = normalizeShells(r.shells);
  for (const m of [...Object.values(models), ...Object.values(shells)]) m.asset = assetPrefix + m.asset.replace(/^visit:/, "");
  const size = normalizeSize(r.size), style = (typeof r.style === "string" && r.style in STYLES ? r.style : DEFAULT_STYLE) as StyleId;
  return { hidden: normalizeHidden(r.hidden), style, size, items: normalizeLayout(r.items, size), options: normalizeOptions(r.options), models, shells };
}

// --- Flat (v1) types and pure helpers. Not wired into useLayout until the cutover PR. ---

export type WallId = "n" | "e" | "s" | "w";
export type Swing = "l" | "r";
export type Piece = { kind: string; wall?: WallId; swing?: Swing };
export type Pieces = Record<string, Piece>;
export type Flat = {
  name: string;
  style: StyleId;
  size: RoomSize;
  plan: FlatPlan;
  pieces: Pieces;
  items: Layout;
  options: Options;
  models: Models;
  shells: Shells;
};

export const FLAT_DEFAULT_SIZE: RoomSize = { w: 4, d: 4.5, h: 2.6 };
export const FLAT_SIZE_RANGE: Record<keyof RoomSize, [number, number]> = { w: [2.4, 8], d: [2.4, 8], h: [2.4, 3.2] };
export const DOOR_SIZE = { w: 0.8, h: 2.05 };
export const SHELF_INSET = 0.13;
export const CEILING_LIGHT_DROP = 0.115;
const PIECE_ID = /^p-[0-9a-f]{8}$/;
const WALLS: WallId[] = ["n", "e", "s", "w"];
const OPENING_KINDS = new Set(["door", "window"]);
const MAX_PIECES = 80;
const FLOOR_SCALE: [number, number] = [0.5, 2];

export function normalizeFlatSize(raw: unknown): RoomSize {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const one = (k: keyof RoomSize) => {
    const [lo, hi] = FLAT_SIZE_RANGE[k], v = r[k];
    return typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100 : FLAT_DEFAULT_SIZE[k];
  };
  return { w: one("w"), d: one("d"), h: one("h") };
}

// pose.rotationY when the mesh is on that wall. Authored wall's entry is 0.
export const OPENING_YAW: Record<"door" | "window", Record<WallId, number>> = {
  door: { s: 0, w: -Math.PI / 2, n: Math.PI, e: Math.PI / 2 },
  window: { n: 0, e: -Math.PI / 2, s: Math.PI, w: Math.PI / 2 },
};
export const SHELF_YAW: Record<WallId, number> = { w: 0, n: -Math.PI / 2, e: Math.PI, s: Math.PI / 2 };

function wallHalf(wall: WallId, size: RoomSize): { fixed: number; alongAxis: 0 | 2; alongHalf: number; sign: 1 | -1 } {
  if (wall === "n") return { fixed: -size.d / 2, alongAxis: 0, alongHalf: size.w / 2, sign: -1 };
  if (wall === "s") return { fixed: size.d / 2, alongAxis: 0, alongHalf: size.w / 2, sign: 1 };
  if (wall === "w") return { fixed: -size.w / 2, alongAxis: 2, alongHalf: size.d / 2, sign: -1 };
  return { fixed: size.w / 2, alongAxis: 2, alongHalf: size.d / 2, sign: 1 };
}

export function pinOpening(kind: "door" | "window", wall: WallId, pose: Pose, size: RoomSize): Pose {
  const hole = kind === "door" ? DOOR_SIZE : WINDOW_SIZE;
  const { fixed, alongHalf } = wallHalf(wall, size);
  const margin = hole.w / 2 + 0.05;
  const position: Vec3 = [...pose.position];
  if (wall === "n" || wall === "s") {
    position[2] = fixed;
    position[0] = finite(position[0], -alongHalf + margin, alongHalf - margin, 0);
  } else {
    position[0] = fixed;
    position[2] = finite(position[2], -alongHalf + margin, alongHalf - margin, 0);
  }
  if (kind === "door") {
    position[1] = 0;
  } else {
    const hh = hole.h / 2 + 0.05;
    position[1] = finite(position[1], 0.1 + hh, size.h - 0.1 - hh, 1.55);
  }
  return { position, rotationY: OPENING_YAW[kind][wall], scale: 1 };
}

export function pinShelf(wall: WallId, pose: Pose, size: RoomSize): Pose {
  const { fixed, alongHalf, sign } = wallHalf(wall, size);
  const inset = fixed - sign * SHELF_INSET;
  const position: Vec3 = [...pose.position];
  if (wall === "n" || wall === "s") {
    position[2] = inset;
    position[0] = finite(position[0], -alongHalf + 0.2, alongHalf - 0.2, 0);
  } else {
    position[0] = inset;
    position[2] = finite(position[2], -alongHalf + 0.2, alongHalf - 0.2, 0);
  }
  position[1] = finite(position[1], 0.4, size.h - 0.3, 1.5);
  return { position, rotationY: SHELF_YAW[wall], scale: finite(pose.scale, FLOOR_SCALE[0], FLOOR_SCALE[1], 1) };
}

export function kindOfPiece(id: string, pieces: Pieces, models: Models): string | undefined {
  if (pieces[id]) return pieces[id].kind;
  if (id.startsWith("model-") && models[id]) return id;
  return undefined;
}

export function clampPiece(kind: string, piece: Piece, pose: Pose, size: RoomSize): Pose {
  if (kind === "door" || kind === "window") {
    const wall = piece.wall && WALLS.includes(piece.wall) ? piece.wall : kind === "door" ? "s" : "n";
    return pinOpening(kind, wall, pose, size);
  }
  if (kind === "wall-shelf") {
    const wall = piece.wall && WALLS.includes(piece.wall) ? piece.wall : "w";
    return pinShelf(wall, pose, size);
  }
  if (kind === "ceiling-light") {
    return {
      position: [
        finite(pose.position[0], -size.w / 2, size.w / 2, 0),
        size.h - CEILING_LIGHT_DROP,
        finite(pose.position[2], -size.d / 2, size.d / 2, 0),
      ],
      rotationY: finite(pose.rotationY, -1e3, 1e3, 0) % (2 * Math.PI),
      scale: 1,
    };
  }
  return {
    position: [
      finite(pose.position[0], -size.w / 2, size.w / 2, 0),
      finite(pose.position[1], 0, size.h, 0),
      finite(pose.position[2], -size.d / 2, size.d / 2, 0),
    ],
    rotationY: finite(pose.rotationY, -1e3, 1e3, 0) % (2 * Math.PI),
    scale: finite(pose.scale, FLOOR_SCALE[0], FLOOR_SCALE[1], 1),
  };
}

/** An empty shell for a plan: the ceiling light, nothing else. */
export function flatFromPlan(plan: FlatPlan, style: string): Flat {
  const b = planBounds(plan);
  const size: RoomSize = { w: Math.round(b.w * 100) / 100, d: Math.round(b.d * 100) / 100, h: plan.h };
  const living = plan.rooms.find((r) => r.id === "living") ?? plan.rooms[0];
  const id = "p-00000003";
  const pose: Pose = { position: [living.x, plan.h - CEILING_LIGHT_DROP, living.z], rotationY: 0, scale: 1 };
  return {
    name: plan.name,
    style: style in STYLES ? style : DEFAULT_STYLE,
    size,
    plan,
    pieces: { [id]: { kind: "ceiling-light" } },
    items: { [id]: pose },
    options: {},
    models: {},
    shells: {},
  };
}

export function defaultFlat(): Flat {
  return flatFromPlan(shimizu(), "shimizu");
}

export function persistFlat(f: Pick<Flat, "name" | "style" | "size" | "plan" | "pieces" | "items" | "options" | "models" | "shells">): Flat {
  return {
    name: f.name,
    style: f.style,
    size: f.size,
    plan: f.plan,
    pieces: f.pieces,
    items: f.items,
    options: f.options,
    models: f.models,
    shells: f.shells,
  };
}

function parsePose(raw: unknown, size: RoomSize): Pose | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>, pos = Array.isArray(q.position) ? q.position : [];
  if (pos.length !== 3) return null;
  return {
    position: [finite(pos[0], -size.w / 2, size.w / 2, 0), finite(pos[1], 0, size.h, 0), finite(pos[2], -size.d / 2, size.d / 2, 0)],
    rotationY: finite(q.rotationY, -1e3, 1e3, 0) % (2 * Math.PI),
    scale: finite(q.scale, 0.25, 4, 1),
  };
}

function normalizePlan(raw: unknown): FlatPlan {
  // Only the built-in template: hand-edited plans, and plans from the older
  // rooms+doorways shape, are rejected rather than half-rendered.
  if (raw && typeof raw === "object") {
    const p = raw as FlatPlan;
    const roomsOk = Array.isArray(p.rooms) && p.rooms.length >= 3 && p.rooms.every(
      (r) => r && typeof r.id === "string" && typeof r.w === "number" && typeof r.d === "number",
    );
    const wallsOk = Array.isArray(p.partitions) && p.partitions.every(
      (w) => w && (w.axis === "x" || w.axis === "z") && typeof w.fixed === "number",
    );
    const windowsOk = Array.isArray(p.windows) && p.windows.every(
      (w) => w && ["n", "e", "s", "w"].includes(w.wall) && typeof w.at === "number"
        && typeof w.width === "number" && typeof w.sill === "number" && typeof w.height === "number",
    );
    const doorOk = !!p.entrance && typeof p.entrance.x === "number" && typeof p.entrance.width === "number"
      && typeof p.entrance.height === "number";
    if (roomsOk && wallsOk && windowsOk && doorOk) {
      return { ...p, id: typeof p.id === "string" && p.id ? p.id : "shimizu" };
    }
  }
  return shimizu();
}

export function normalizeFlat(raw: unknown, assetPrefix = ""): Flat {
  if (!raw || typeof raw !== "object") return defaultFlat();
  const r = raw as Record<string, unknown>;
  const plan = normalizePlan(r.plan);
  const b = planBounds(plan);
  const size: RoomSize = {
    w: Math.round(b.w * 100) / 100,
    d: Math.round(b.d * 100) / 100,
    h: typeof (r.size as RoomSize | undefined)?.h === "number" ? normalizeFlatSize(r.size).h : plan.h,
  };
  // Keep plan height authoritative for the shell.
  plan.h = size.h;
  const style = (typeof r.style === "string" && r.style in STYLES ? r.style : "shimizu" in STYLES ? "shimizu" : DEFAULT_STYLE) as StyleId;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, 40) || "Flat" : "Flat";
  const models = normalizeModels(r.models);
  const shells = normalizeShells(r.shells);
  for (const m of [...Object.values(models), ...Object.values(shells)]) m.asset = assetPrefix + m.asset.replace(/^visit:/, "");

  const rawPieces = r.pieces && typeof r.pieces === "object" ? r.pieces as Record<string, unknown> : {};
  const sortedIds = Object.keys(rawPieces).filter((id) => PIECE_ID.test(id)).sort().slice(0, MAX_PIECES);
  const pieces: Pieces = {};
  const wallTaken: Partial<Record<WallId, string>> = {};

  for (const id of sortedIds) {
    const p = rawPieces[id];
    if (!p || typeof p !== "object") continue;
    const kind = (p as { kind?: unknown }).kind;
    if (typeof kind !== "string" || !catalogueKind(kind) || !pieceHome(kind)) continue;
    const piece: Piece = { kind };
    if (OPENING_KINDS.has(kind) || kind === "wall-shelf") {
      const wall = (p as { wall?: unknown }).wall;
      const w = typeof wall === "string" && WALLS.includes(wall as WallId) ? wall as WallId : kind === "door" ? "s" : kind === "window" ? "n" : "w";
      if (OPENING_KINDS.has(kind)) {
        if (wallTaken[w]) continue;
        wallTaken[w] = id;
        piece.wall = w;
        const swing = (p as { swing?: unknown }).swing;
        if (kind === "door") piece.swing = swing === "l" || swing === "r" ? swing : "r";
      } else {
        piece.wall = w;
      }
    }
    pieces[id] = piece;
  }

  const items: Layout = {};
  const rawItems = r.items && typeof r.items === "object" ? r.items as Record<string, unknown> : {};
  for (const id of Object.keys(pieces)) {
    const pose = parsePose(rawItems[id], size);
    if (!pose) { delete pieces[id]; continue; }
    items[id] = clampPiece(pieces[id].kind, pieces[id], pose, size);
  }
  for (const id of Object.keys(models)) {
    const pose = parsePose(rawItems[id], size);
    if (pose) items[id] = {
      position: pose.position,
      rotationY: pose.rotationY,
      scale: finite(pose.scale, FLOOR_SCALE[0], FLOOR_SCALE[1], 1),
    };
  }

  // Drop shells / options for ids that are neither pieces nor models.
  const keep = new Set([...Object.keys(pieces), ...Object.keys(models)]);
  const cleanShells: Shells = {};
  for (const [id, s] of Object.entries(shells)) if (keep.has(id)) cleanShells[id] = s;
  const options = normalizeOptions(r.options, (id) => kindOfPiece(id, pieces, models));

  if (!Object.keys(pieces).length && !Object.keys(models).length) return defaultFlat();
  return { name, style, size, plan, pieces, items, options, models, shells: cleanShells };
}

function newPieceId(used: Set<string>): string {
  for (let i = 0; i < 32; i++) {
    const id = `p-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    if (!used.has(id)) return id;
  }
  throw new Error("could not allocate piece id");
}

function snap5(v: number) {
  return Math.round(v * 20) / 20;
}

function lookForKind(kind: string, style: StyleId): string | undefined {
  const entry = catalogueEntry(kind);
  if (entry?.defaultLook) return entry.defaultLook;
  const fromStyle = itemDefaults(style, kind).variant;
  if (fromStyle) return fromStyle;
  return ITEMS[kind]?.variants[0];
}

function openingWallsTaken(pieces: Pieces): Set<WallId> {
  const taken = new Set<WallId>();
  for (const p of Object.values(pieces)) {
    if (catalogueEntry(p.kind)?.opening && p.wall) taken.add(p.wall);
  }
  return taken;
}

function firstFreeWall(pieces: Pieces): WallId | null {
  const taken = openingWallsTaken(pieces);
  for (const w of WALLS) if (!taken.has(w)) return w;
  return null;
}

export type CamSpawn = { roomPos: Vec3; yawDeg: number };

/** Floor spawn 1.2 m in front of the camera (same math as addModelFile), snapped to 5 cm. */
export function floorSpawnPose(kind: string, cam: CamSpawn, size: RoomSize): Pose {
  const a = (cam.yawDeg * Math.PI) / 180, fx = Math.sin(a), fz = -Math.cos(a);
  const clamp = (v: number, half: number) => Math.min(half - 0.3, Math.max(0.3 - half, v));
  const facing = Math.atan2(-fx, -fz);
  const homeYaw = pieceHome(kind)?.rotationY ?? 0;
  return {
    position: [snap5(clamp(cam.roomPos[0] + fx * 1.2, size.w / 2)), 0, snap5(clamp(cam.roomPos[2] + fz * 1.2, size.d / 2))],
    rotationY: kind === "chair" ? facing : homeYaw,
    scale: 1,
  };
}

export type PieceResult = { flat: Flat; id: string | null; error?: string };

export function addPiece(flat: Flat, kind: string, cam: CamSpawn, extra?: Partial<Piece>): PieceResult {
  const entry = catalogueEntry(kind);
  if (!entry || !catalogueKind(kind)) return { flat, id: null, error: "unknown kind" };
  if (Object.keys(flat.pieces).length >= UI_PIECE_CAP) return { flat, id: null, error: "piece cap" };
  if (entry.max) {
    const n = Object.values(flat.pieces).filter((p) => p.kind === kind).length;
    if (n >= entry.max) return { flat, id: null, error: "kind max" };
  }

  const used = new Set(Object.keys(flat.pieces));
  const id = newPieceId(used);
  const piece: Piece = { kind, ...extra };

  let pose: Pose;
  if (entry.opening) {
    const wall = piece.wall && WALLS.includes(piece.wall) ? piece.wall : firstFreeWall(flat.pieces);
    if (!wall) return { flat, id: null, error: "no free wall" };
    if (openingWallsTaken(flat.pieces).has(wall)) return { flat, id: null, error: "wall taken" };
    piece.wall = wall;
    if (kind === "door") piece.swing = piece.swing === "l" || piece.swing === "r" ? piece.swing : "r";
    pose = pinOpening(kind as "door" | "window", wall, { position: [0, kind === "window" ? 1.55 : 0, 0], rotationY: 0, scale: 1 }, flat.size);
  } else if (kind === "wall-shelf") {
    const wall = piece.wall && WALLS.includes(piece.wall) ? piece.wall : "w";
    piece.wall = wall;
    pose = pinShelf(wall, { position: [0, 1.5, 0], rotationY: 0, scale: 1 }, flat.size);
  } else if (kind === "ceiling-light") {
    pose = clampPiece(kind, piece, { position: [0, flat.size.h - CEILING_LIGHT_DROP, 0], rotationY: 0, scale: 1 }, flat.size);
  } else {
    pose = clampPiece(kind, piece, floorSpawnPose(kind, cam, flat.size), flat.size);
  }

  const look = lookForKind(kind, flat.style);
  const options = { ...flat.options };
  if (look) options[id] = { ...(options[id] ?? {}), look };

  return {
    flat: {
      ...flat,
      pieces: { ...flat.pieces, [id]: piece },
      items: { ...flat.items, [id]: pose },
      options,
    },
    id,
  };
}

export function duplicatePiece(flat: Flat, id: string): PieceResult {
  const src = flat.pieces[id], pose = flat.items[id];
  if (!src || !pose) return { flat, id: null, error: "missing" };
  if (Object.keys(flat.pieces).length >= UI_PIECE_CAP) return { flat, id: null, error: "piece cap" };
  const entry = catalogueEntry(src.kind);
  if (entry?.opening) return { flat, id: null, error: "opening" };
  if (entry?.max) {
    const n = Object.values(flat.pieces).filter((p) => p.kind === src.kind).length;
    if (n >= entry.max) return { flat, id: null, error: "kind max" };
  }
  const nid = newPieceId(new Set(Object.keys(flat.pieces)));
  const nextPose = clampPiece(src.kind, src, {
    position: [pose.position[0] + 0.4, pose.position[1], pose.position[2]],
    rotationY: pose.rotationY,
    scale: pose.scale,
  }, flat.size);
  const options = { ...flat.options };
  if (flat.options[id]) options[nid] = { ...flat.options[id] };
  const shells = { ...flat.shells };
  if (flat.shells[id]) shells[nid] = { ...flat.shells[id] };
  return {
    flat: {
      ...flat,
      pieces: { ...flat.pieces, [nid]: { ...src } },
      items: { ...flat.items, [nid]: nextPose },
      options,
      shells,
    },
    id: nid,
  };
}

export function removePiece(flat: Flat, id: string): Flat {
  if (!flat.pieces[id]) return flat;
  const pieces = { ...flat.pieces }, items = { ...flat.items }, options = { ...flat.options }, shells = { ...flat.shells };
  delete pieces[id]; delete items[id]; delete options[id]; delete shells[id];
  return { ...flat, pieces, items, options, shells };
}

export function setWall(flat: Flat, id: string, wall: WallId): Flat {
  const piece = flat.pieces[id], pose = flat.items[id];
  if (!piece || !pose) return flat;
  const entry = catalogueEntry(piece.kind);
  if (!entry || (entry.mount !== "wall" && !entry.opening)) return flat;
  if (entry.opening) {
    for (const [oid, p] of Object.entries(flat.pieces)) {
      if (oid !== id && catalogueEntry(p.kind)?.opening && p.wall === wall) return flat;
    }
  }
  const next = { ...piece, wall };
  return {
    ...flat,
    pieces: { ...flat.pieces, [id]: next },
    items: { ...flat.items, [id]: clampPiece(piece.kind, next, pose, flat.size) },
  };
}

export function setSwing(flat: Flat, id: string, swing: Swing): Flat {
  const piece = flat.pieces[id];
  if (!piece || piece.kind !== "door") return flat;
  return { ...flat, pieces: { ...flat.pieces, [id]: { ...piece, swing } } };
}

const KEEP_ON_CLEAR = new Set(["door", "window", "ceiling-light"]);

export function clearFurniture(flat: Flat): Flat {
  const pieces: Pieces = {}, items: Layout = {}, options: Options = {}, shells: Shells = {};
  for (const [id, p] of Object.entries(flat.pieces)) {
    if (!KEEP_ON_CLEAR.has(p.kind)) continue;
    pieces[id] = p;
    if (flat.items[id]) items[id] = flat.items[id];
    if (flat.options[id]) options[id] = flat.options[id];
    if (flat.shells[id]) shells[id] = flat.shells[id];
  }
  return { ...flat, pieces, items, options, models: {}, shells };
}

export function resetFlat(_flat?: Flat): Flat {
  return defaultFlat();
}

function flatOf(s: Flat): Flat {
  return persistFlat(s);
}

function kindLookup(s: { pieces: Pieces; models: Models }) {
  return (id: string) => kindOfPiece(id, s.pieces, s.models) ?? id;
}

type State = Flat & {
  hidden: string[]; // unused in flat UI; kept so unmounted bedroom modules still typecheck
  editing: boolean;
  selected: string | null;
  dragging: boolean;
  past: Flat[];
  slots: string[];
  setStyle: (style: StyleId) => void;
  setSize: (size: Partial<RoomSize>) => void;
  setShell: (id: string, shell: Shells[string] | null) => void;
  setOption: (id: string, key: string, value: string) => void;
  setLook: (id: string, look: string) => void;
  applyLook: (id: string, options: Record<string, string>, shell: Shells[string] | null) => void;
  move: (id: string, pose: Pose) => void;
  snapshot: () => void;
  undo: () => void;
  addModel: (asset: string, name: string, pose: Pose) => string;
  removeModel: (id: string) => void;
  addPieceAction: (kind: string) => string | null;
  duplicatePieceAction: (id: string) => string | null;
  removePieceAction: (id: string) => void;
  setWallAction: (id: string, wall: WallId) => void;
  setSwingAction: (id: string, swing: Swing) => void;
  clearFurnitureAction: () => void;
  resetFlatAction: () => void;
  applyPlanAction: (id: string) => void;
};

const boot = defaultFlat();

export const useLayout = create<State>()(
  persist(
    (set, get) => ({
      ...boot,
      hidden: [],
      slots: [],
      editing: true,
      selected: null,
      dragging: false,
      past: [],
      setStyle: (style) => { get().snapshot(); set({ style }); },
      setSize: (patch) => set((s) => {
        const size = normalizeFlatSize({ ...s.size, ...patch }), items: Layout = {};
        for (const [id, p] of Object.entries(s.items)) {
          const piece = s.pieces[id];
          if (piece) {
            const a = !catalogueEntry(piece.kind)?.opening && piece.kind !== "wall-shelf" && piece.kind !== "ceiling-light"
              ? anchorOf(id, p.position, s.size) : { x: 0, z: 0 };
            const shifted: Pose = {
              ...p,
              position: [p.position[0] + (a.x * (size.w - s.size.w)) / 2, p.position[1], p.position[2] + (a.z * (size.d - s.size.d)) / 2],
            };
            items[id] = clampPiece(piece.kind, piece, shifted, size);
          } else {
            items[id] = p;
          }
        }
        return { size, items };
      }),
      setShell: (id, shell) => {
        get().snapshot();
        set((s) => {
          const shells = { ...s.shells };
          if (shell) Object.assign(shells, normalizeShells({ [id]: shell })); else delete shells[id];
          return { shells };
        });
      },
      move: (id, pose) => set((s) => {
        const piece = s.pieces[id];
        const next: Pose = piece ? clampPiece(piece.kind, piece, pose, s.size) : {
          position: [
            finite(pose.position[0], -s.size.w / 2, s.size.w / 2, 0),
            finite(pose.position[1], 0, s.size.h, 0),
            finite(pose.position[2], -s.size.d / 2, s.size.d / 2, 0),
          ] as Vec3,
          rotationY: finite(pose.rotationY, -1e3, 1e3, 0) % (2 * Math.PI),
          scale: finite(pose.scale, 0.5, 2, 1),
        };
        return { items: { ...s.items, [id]: next } };
      }),
      addModel: (asset, name, pose) => {
        const id = `model-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
        get().snapshot();
        set((s) => ({
          models: { ...s.models, [id]: { asset, name } },
          items: { ...s.items, [id]: { ...pose, scale: finite(pose.scale, 0.5, 2, 1) } },
          selected: id,
        }));
        return id;
      },
      removeModel: (id) => {
        get().snapshot();
        set((s) => {
          const models = { ...s.models }, items = { ...s.items }, options = { ...s.options };
          delete models[id]; delete items[id]; delete options[id];
          return { models, items, options, selected: s.selected === id ? null : s.selected };
        });
      },
      setOption: (id, key, value) => {
        get().snapshot();
        set((s) => ({
          options: { ...s.options, ...normalizeOptions({ [id]: { ...s.options[id], [key]: value } }, kindLookup(s)) },
        }));
      },
      setLook: (id, look) => {
        get().snapshot();
        set((s) => {
          const shells = { ...s.shells };
          delete shells[id];
          return { shells, options: { ...s.options, ...normalizeOptions({ [id]: { ...s.options[id], look } }, kindLookup(s)) } };
        });
      },
      applyLook: (id, opts, shell) => {
        get().snapshot();
        set((s) => {
          const shells = { ...s.shells }, options = { ...s.options };
          delete shells[id];
          delete options[id];
          if (shell) Object.assign(shells, normalizeShells({ [id]: shell }));
          return { shells, options: { ...options, ...normalizeOptions({ [id]: opts }, kindLookup(s)) } };
        });
      },
      snapshot: () => set((s) => ({ past: [...s.past.slice(-19), flatOf(s)] })),
      undo: () => set((s) => {
        if (!s.past.length) return {};
        const prev = s.past[s.past.length - 1];
        return { ...prev, past: s.past.slice(0, -1), selected: s.selected && prev.pieces[s.selected] ? s.selected : null };
      }),
      addPieceAction: (kind) => {
        const g = useGame.getState();
        const cam = { roomPos: g.roomPos, yawDeg: g.yaw };
        get().snapshot();
        const r = addPiece(flatOf(get()), kind, cam);
        if (!r.id) { get().undo(); return null; }
        set({ ...r.flat, selected: r.id });
        return r.id;
      },
      duplicatePieceAction: (id) => {
        get().snapshot();
        const r = duplicatePiece(flatOf(get()), id);
        if (!r.id) { get().undo(); return null; }
        set({ ...r.flat, selected: r.id });
        return r.id;
      },
      removePieceAction: (id) => {
        get().snapshot();
        set((s) => ({ ...removePiece(flatOf(s), id), selected: s.selected === id ? null : s.selected }));
      },
      setWallAction: (id, wall) => { get().snapshot(); set((s) => setWall(flatOf(s), id, wall)); },
      setSwingAction: (id, swing) => { get().snapshot(); set((s) => setSwing(flatOf(s), id, swing)); },
      clearFurnitureAction: () => { get().snapshot(); set((s) => ({ ...clearFurniture(flatOf(s)), selected: null })); },
      resetFlatAction: () => {
        const choice = floorplanById(get().plan.id) ?? floorplanById("shimizu")!;
        const plan = choice.build();
        get().snapshot();
        set({ ...flatFromPlan(plan, choice.style), selected: null });
        useGame.setState({ openDoors: {} });
      },
      applyPlanAction: (id) => {
        const choice = floorplanById(id);
        if (!choice) return;
        const plan = choice.build();
        const spawn = livingSpawn(plan);
        set({ ...flatFromPlan(plan, choice.style), selected: null, past: [] });
        useGame.setState({ ...spawn, openDoors: {}, pitch: 8, choosing: false, view: "room" });
      },
    }),
    {
      name: "my-flat-layout",
      version: 12,
      storage,
      partialize: (s) => persistFlat(s),
      merge: (saved, cur) => ({ ...cur, ...normalizeFlat(saved) }),
      migrate: (persisted, version) => {
        if (version < 2) {
          try {
            const raw = localStorage.getItem("my-flat-layout");
            if (raw && !localStorage.getItem("my-flat-layout-v1-backup")) {
              localStorage.setItem("my-flat-layout-v1-backup", raw);
              sessionStorage.setItem("my-flat-did-migrate", "1");
            }
          } catch { /* ignore */ }
          return defaultFlat();
        }
        // v11 stretched the whole plan, doors included; v12 keeps door leaves at real width.
        if (version < 12) return defaultFlat();
        return persisted as Flat;
      },
    },
  ),
);

// Hidden itself, or standing on a hidden item it hasn't been moved off.
export function hiddenOf(id: string, s: { items: Layout; hidden: string[] }): boolean {
  const on = ITEMS[id]?.on;
  return s.hidden.includes(id) || (!!on && !s.items[id] && hiddenOf(on, s));
}

// An item's pose now: where it was moved to, or its rest position in the current room.
export function poseOf(id: string, home: Home, s: { items: Layout; size: RoomSize } = useLayout.getState()): Pose {
  if (s.items[id]) return s.items[id];
  const on = ITEMS[id]?.on, parentHome = on ? HOMES[on] : undefined;
  if (!on || !parentHome) return restPose(id, home, s.size);
  // Standing on its parent: carried by the parent's pose.
  const parent = poseOf(on, parentHome, s), p = new THREE.Vector3(...home.position).applyMatrix4(itemMatrix(parentHome, parent));
  return { position: [p.x, p.y, p.z], rotationY: (home.rotationY ?? 0) + parent.rotationY - (parentHome.rotationY ?? 0), scale: parent.scale };
}

// Item-local → world for a pose (identity when the item is at home): T(pose) · Ry(Δyaw) · S · T(−home).
export function itemMatrix(home: Home, pose: Pose | undefined, out = new THREE.Matrix4()) {
  if (!pose) return out.identity();
  const m = new THREE.Matrix4();
  return out.makeTranslation(...pose.position)
    .multiply(m.makeRotationY(pose.rotationY - (home.rotationY ?? 0)))
    .multiply(m.makeScale(pose.scale, pose.scale, pose.scale))
    .multiply(m.makeTranslation(-home.position[0], -home.position[1], -home.position[2]));
}

// Where an item-local point (modelled at home) is now: for things joining two items, like cables.
const tmpM = new THREE.Matrix4();
export function placePoint(id: string, p: Vec3, items: Layout, out = new THREE.Vector3(), size: RoomSize = DEFAULT_SIZE): THREE.Vector3 {
  const home = HOMES[id] ?? liveHomes.get(id);
  out.set(...p);
  if (!home) { // rolled clutter not drawn yet: unmoved, it goes where what it stands on goes
    const on = ITEMS[id]?.on;
    return on && !items[id] ? placePoint(on, p, items, out, size) : out;
  }
  return out.applyMatrix4(itemMatrix(home, poseOf(id, home, { items, size }), tmpM));
}

// The room's current style (see styles.ts).
export const useStyle = (): Style => useLayout((s) => styleOf(s.style));
