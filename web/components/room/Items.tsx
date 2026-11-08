"use client";

import { useLayout, kindOfPiece } from "@/lib/room";
import { pieceHome } from "@/lib/frame";
import { useVariant } from "@/items/resolve";
import { RoomItem } from "./RoomItem";
import { ContactShadow } from "@/items/_shared/ContactShadow";
import { catalogueEntry } from "@/lib/catalogue";

function PieceView({ id, kind }: { id: string; kind: string }) {
  const home = pieceHome(kind);
  const variant = useVariant(kind, id);
  const size = useLayout((s) => s.options[id]?.size);
  if (!variant || !home) return null;
  const fp = variant.footprint?.(size);
  const shadowAt: [number, number] =
    home.position[0] === 0 && home.position[2] === 0
      ? [0, 0]
      : [home.position[0], home.position[2]];
  const skipShadow = kind === "desk" || kind === "bin";
  return (
    <RoomItem id={id} home={home}>
      <variant.Component id={id} />
      {fp && !skipShadow && <ContactShadow x={shadowAt[0]} z={shadowAt[1]} size={fp} />}
    </RoomItem>
  );
}

export function Items() {
  const pieces = useLayout((s) => s.pieces);
  // Openings stay hidden until the openings PR mounts holes.
  const ids = Object.entries(pieces).filter(([, p]) => !catalogueEntry(p.kind)?.opening);
  return (
    <>
      {ids.map(([id, p]) => (
        <PieceView key={id} id={id} kind={p.kind} />
      ))}
    </>
  );
}

export function pieceKind(id: string) {
  const s = useLayout.getState();
  return kindOfPiece(id, s.pieces, s.models);
}
