"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Slab, Part } from "./Surface";
import { Metal } from "./Lighting";
import { views, EYE } from "./City";
import { GROUND } from "./Landscape";
import { useGame } from "@/lib/store";
import { useLayout, useStyle } from "@/lib/room";
import { buildShell, planBounds, shimizu, type FlatPlan, type PlanWindow } from "@/lib/flat-plan";
import type { Vec3 } from "@/lib/store";

export function usePlan(): FlatPlan {
  return useLayout((s) => s.plan) ?? shimizu();
}

export function RoomShell() {
  const plan = usePlan();
  const st = useStyle(), WALL = st.walls, CEILING = st.ceiling;
  const { floors, walls, ceilings } = useMemo(() => buildShell(plan), [plan]);
  const b = useMemo(() => planBounds(plan), [plan]);

  return (
    <>
      {floors.map((r) => (
        <Slab
          key={`f-${r.id}`}
          set={st.floor.set}
          tile={st.floor.tile}
          size={[r.w, 0.1, r.d] as Vec3}
          position={[r.x, -0.05, r.z]}
          color={st.floor.tint}
          cast={false}
        />
      ))}
      {ceilings.map((r) => (
        <Slab
          key={`c-${r.id}`}
          set="grey_plaster"
          tile={1}
          size={[r.w, 0.1, r.d] as Vec3}
          position={[r.x, plan.h - 0.05, r.z]}
          color={CEILING}
          cast={false}
          grainOnly={st.paintedWalls}
        />
      ))}
      {walls.map((w, i) => (
        <Slab
          key={`w-${i}`}
          set="grey_plaster"
          tile={1}
          size={[w.sx, w.sy, w.sz] as Vec3}
          position={[w.x, w.y, w.z]}
          color={WALL}
          cast={false}
          grainOnly={st.paintedWalls}
        />
      ))}
      {/* The front door leaf, closed in its hole on the corridor side. */}
      <Part
        size={[plan.entrance.width - 0.02, plan.entrance.height - 0.02, 0.045] as Vec3}
        position={[plan.entrance.x, (plan.entrance.height - 0.02) / 2, b.z0 + 0.075]}
        color={new THREE.Color("#8a7a66")}
        gloss={0.15}
      />
      {plan.windows.map((w, i) => (
        <WindowGlass key={`win-${i}`} win={w} bounds={b} />
      ))}
    </>
  );
}

// A window in a perimeter wall: metal frame + a faint glass pane that only shows reflections.
function WindowGlass({ win, bounds }: { win: PlanWindow; bounds: { x0: number; x1: number; z0: number; z1: number } }) {
  const y = win.sill + win.height / 2, hw = win.width / 2, f = 0.05, t = 0.03;
  const ns = win.wall === "n" || win.wall === "s";
  // The wall's plane (inner face) and the yaw that faces back into the room.
  const plane = win.wall === "n" ? bounds.z0 + 0.06 : win.wall === "s" ? bounds.z1 - 0.06
    : win.wall === "e" ? bounds.x1 - 0.06 : bounds.x0 + 0.06;
  const yaw = win.wall === "n" ? 0 : win.wall === "s" ? Math.PI : win.wall === "e" ? -Math.PI / 2 : Math.PI / 2;
  const pos = (along: number, up: number, thick: number): Vec3 =>
    ns ? [win.at + along, up, plane] : [plane, up, win.at + along];

  return (
    <group>
      {/* Jambs, head, and a protruding sill, in the wall's plane. */}
      <Metal position={pos(-hw - 0.025, y, t)} size={ns ? [f, win.height + 0.1, t] : [t, win.height + 0.1, f]} />
      <Metal position={pos(hw + 0.025, y, t)} size={ns ? [f, win.height + 0.1, t] : [t, win.height + 0.1, f]} />
      <Metal position={pos(0, win.sill + win.height + 0.025, t)} size={ns ? [win.width, f, t] : [t, f, win.width]} />
      <Metal position={pos(0, win.sill - 0.025, t * 2)} size={ns ? [win.width + 0.1, f, t * 2] : [t * 2, f, win.width + 0.1]} />
      {/* Glass: black additive dielectric, so only its reflections show. */}
      <mesh position={pos(0, y, 0)} rotation={[0, yaw, 0]}>
        <planeGeometry args={[win.width, win.height]} />
        <meshStandardMaterial color="black" roughness={0.12} metalness={0} blending={THREE.AdditiveBlending} depthWrite={false} envMapIntensity={2} />
      </mesh>
    </group>
  );
}

// The world beyond the window wall: sky dome, ground, and the three parallax layers.
// Painted once per style; positioned beyond the south wall so every window looks out on it.
export function WindowScenery() {
  const plan = usePlan();
  const style = useStyle();
  const preset = useGame((s) => s.preset);
  const b = useMemo(() => planBounds(plan), [plan]);
  const tint = style.presets[preset % 3].window;
  const kind = style.outside, pines = style.name === "Scandinavian";
  const { skyMap, layers, ground } = useMemo(() => views(kind, pines), [kind, pines]);
  if (!plan.windows.some((w) => w.wall === "s")) return null;
  return (
    <group position={[0, 0, b.z1]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, EYE, 0]}>
        <sphereGeometry args={[900, 48, 24]} />
        <meshBasicMaterial map={skyMap} color={tint} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {ground && (
        <mesh position={[0, EYE - GROUND, -1000]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3000, 2000]} />
          <meshBasicMaterial map={ground} color={tint} />
        </mesh>
      )}
      {layers.map(({ L, map }) => (
        <mesh key={L.depth} position={[0, EYE + (L.above - L.below) / 2, -L.depth]}>
          <planeGeometry args={[L.halfWidth * 2, L.above + L.below]} />
          <meshBasicMaterial map={map} color={tint} transparent alphaTest={0.02} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Skirting() {
  return null;
}