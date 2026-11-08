"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "./CameraRig";
import { RoomShell, Skirting, WindowScenery } from "./Room";
import { Lighting } from "./Lighting";
import { PostFX } from "./PostFX";
import { Items } from "./Items";
import { Tooltip } from "./Clickable";
import { SelectionBox } from "./SelectionBox";
import { BudgetProbe } from "./BudgetProbe";
import { useLayout } from "@/lib/room";
import { EditPanel } from "@/components/hud/EditPanel";
import { TouchControls } from "@/components/hud/TouchControls";
import { Hud } from "@/components/hud/Hud";
import { useGame } from "@/lib/store";

const DPR_CAP = [1, 1.5, 2];

export default function Scene() {
  const quality = useGame((s) => s.quality), hideUI = useGame((s) => s.hideUI), choosing = useGame((s) => s.choosing);
  return (
    <>
    <Canvas onPointerMissed={() => { if (useLayout.getState().editing) useLayout.setState({ selected: null }); }} shadows="percentage" camera={{ fov: 55, near: 0.03, far: 1200 }} dpr={[1, DPR_CAP[quality]]} style={{ touchAction: "none" }}>
      <Suspense fallback={null}>
        <RoomShell />
        <WindowScenery />
        <Lighting />
        <Items />
        <Skirting />
      </Suspense>
      <CameraRig />
      <SelectionBox />
      <BudgetProbe />
      <PostFX />
    </Canvas>
    <Hud />
    <TouchControls />
    {!hideUI && !choosing && (
      <>
        <Tooltip />
        <EditPanel />
      </>
    )}
    </>
  );
}
