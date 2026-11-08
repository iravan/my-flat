"use client";

import { useMemo } from "react";
import { useGame, type Vec3 } from "@/lib/store";
import { srgb } from "@/lib/lighting";
import { useLayout, useStyle } from "@/lib/room";
import { defineVariant } from "../../types";

const WOOD = srgb(0.32, 0.22, 0.15);
const LAMP: Vec3 = [-1.7, 0.54, 0.45];
const LIGHT_SCALE = { lamp: 4 };

function lampCastsShadow(id: string) {
  const L = useLayout.getState();
  const selected = L.selected && L.pieces[L.selected]?.kind === "lamp" ? L.selected : null;
  if (selected) return selected === id;
  const lamps = Object.keys(L.pieces).filter((k) => L.pieces[k].kind === "lamp").sort();
  return lamps[0] === id;
}

const RIBS = 9;
function Lantern({ id }: { id: string }) {
  const quality = useGame((s) => s.quality);
  const style = useStyle(), glow = useMemo(() => style.lamp.shade.clone().multiplyScalar(1.6), [style]);
  const ribs = useMemo(() => Array.from({ length: RIBS }, (_, i) => 0.21 + (i - (RIBS - 1) / 2) * 0.027), []);
  const cast = useLayout((s) => {
    void s.selected; void s.pieces;
    return quality > 0 && lampCastsShadow(id);
  });
  return (
    <>
      <group position={LAMP}>
        <mesh position={[0, 0.012, 0]} castShadow>
          <boxGeometry args={[0.13, 0.024, 0.13]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.05, 0.06, 0]} castShadow>
            <boxGeometry args={[0.012, 0.09, 0.012]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0.21, 0]} scale={[1, 0.9, 1]}>
          <sphereGeometry args={[0.13, 32, 20]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        {ribs.map((y) => {
          const r = 0.131 * Math.sqrt(Math.max(0, 1 - ((y - 0.21) / 0.117) ** 2));
          return r > 0.02 && (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.0018, 4, 40]} />
              <meshStandardMaterial color={glow.clone().multiplyScalar(0.55)} roughness={0.8} />
            </mesh>
          );
        })}
      </group>
      <pointLight
        position={[LAMP[0], LAMP[1] + 0.21, LAMP[2]]}
        color={style.lamp.light}
        intensity={LIGHT_SCALE.lamp * Math.max(0.25, style.exposure)}
        distance={5}
        decay={1.2}
        castShadow={cast}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
        shadow-radius={quality === 2 ? 4 : 1}
      />
    </>
  );
}

export default defineVariant({ item: "lamp", id: "lantern", name: "Paper lantern", Component: Lantern });
