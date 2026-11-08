import { HOMES, type Home } from "./room";

// RoomItem home for a catalogue kind. Most meshes are authored at HOMES[kind];
// chair and ceiling-light are local-origin (see design.md frame table).
const ORIGIN: Home = { position: [0, 0, 0] };

const LOCAL: Record<string, true> = { chair: true, "ceiling-light": true };

export function pieceHome(kind: string): Home | undefined {
  if (LOCAL[kind]) return ORIGIN;
  return HOMES[kind];
}
