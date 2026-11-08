"use client";

import { useMemo } from "react";
import { useGame, type Vec3 } from "@/lib/store";
import { srgb } from "@/lib/lighting";
import { useLayout, useStyle } from "@/lib/room";
import { defineVariant } from "../../types";

const METAL = srgb(0.55, 0.55, 0.7);
const LAMP: Vec3 = [-1.7, 0.54, 0.45];
const LIGHT_SCALE = { lamp: 4 };

function lampCastsShadow(id: string) {
  const L = useLayout.getState();
  const selected = L.selected && L.pieces[L.selected]?.kind === "lamp" ? L.selected : null;
  if (selected) return selected === id;
  const lamps = Object.keys(L.pieces).filter((k) => L.pieces[k].kind === "lamp").sort();
  return lamps[0] === id;
}

function DrumLamp({ id }: { id: string }) {
  const quality = useGame((s) => s.quality);
  const style = useStyle(), shade = useMemo(() => style.lamp.shade.clone().multiplyScalar(2), [style]);
  const cast = useLayout((s) => {
    void s.selected; void s.pieces;
    return quality > 0 && lampCastsShadow(id);
  });
  return (
    <>
      <group position={LAMP}>
        <mesh position={[0, 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
          <meshStandardMaterial color={METAL} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.2, 32]} />
          <meshBasicMaterial color={shade} toneMapped={false} />
        </mesh>
      </group>
      <pointLight
        position={[LAMP[0], LAMP[1] + 0.38, LAMP[2]]}
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

export default defineVariant({ item: "lamp", id: "drum", name: "Drum shade", Component: DrumLamp });
