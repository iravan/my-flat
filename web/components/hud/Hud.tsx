"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { typing, useGame } from "@/lib/store";
import { styleOf } from "@/lib/styles";
import { takePhoto } from "@/lib/photo";
import { Panel } from "./Panel";
import { PlanSketch } from "./PlanSketch";
import { useLayout } from "@/lib/room";
import { clampWalk, FLOORPLANS, roomAt } from "@/lib/flat-plan";

const one = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : v) as number;

function LeftPanel() {
  const [open, setOpen] = useState(false);
  const preset = useGame((s) => s.preset);
  const muted = useGame((s) => s.muted), volume = useGame((s) => s.volume), style = useLayout((s) => s.style);
  const plan = useLayout((s) => s.plan);
  const pos = useGame((s) => s.roomPos);
  const here = plan ? roomAt(plan, pos[0], pos[2]) : undefined;
  const g = useGame.getState();
  return (
    <>
    <Button size="icon" variant="outline" aria-label={open ? "Close menu" : "Menu"} aria-expanded={open} onClick={() => setOpen(!open)}
      className="fixed right-2.5 top-2.5 z-40 hidden size-10 border-cyan-400/50 bg-black/70 text-lg text-cyan-200 [@media(pointer:coarse)]:flex">{open ? "✕" : "☰"}</Button>
    <Panel side="left" className={`[@media(pointer:coarse)]:left-auto [@media(pointer:coarse)]:right-2.5 [@media(pointer:coarse)]:top-14 [@media(pointer:coarse)]:z-40 [@media(pointer:coarse)]:max-h-[calc(100dvh-4rem)] ${open ? "" : "[@media(pointer:coarse)]:hidden"}`}>
      <p><b className="text-cyan-300">My Flat</b><br /><span className="text-zinc-400">{plan?.name ?? "A flat"} — walk the rooms, place furniture from the right panel.</span></p>
      {here && <p className="text-sm text-fuchsia-300">Now in: <b>{here.name}</b></p>}
      {plan && (
        <p className="text-[11px] text-zinc-500">{plan.rooms.map((r) => r.name).join(" · ")}</p>
      )}
      <div className="grid gap-1">
        <Button size="sm" variant="outline" onClick={g.cyclePreset}>Light: {styleOf(style).presets[preset % 3].name} [L]</Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="w-28" onClick={() => useGame.setState({ muted: !muted })}>Sound: {muted ? "off" : "on"} [M]</Button>
          <Slider aria-label="Volume" min={0} max={1} step={0.01} value={[volume]} onValueChange={(v) => useGame.setState({ volume: one(v) })} />
        </div>
        <Button size="sm" variant="outline" onClick={takePhoto}>Photo [P]</Button>
        <Button size="sm" variant="outline" onClick={() => useGame.setState({ hideUI: true })}>Hide UI [H]</Button>
        <div className="grid grid-cols-2 gap-1">
          <Button size="sm" variant="outline" onClick={() => useGame.setState({ dialog: "settings" })}>Settings</Button>
          <Button size="sm" variant="outline" onClick={() => useGame.setState({ dialog: "controls" })}>Controls [?]</Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => useGame.setState({ choosing: true })}>Floor plans</Button>
      </div>
    </Panel>
    </>
  );
}

const CONTROLS: [string, string][] = [
  ["Walk", "WASD or arrows · touch stick on phones"],
  ["Look", "Drag empty space"],
  ["Place", "Add from the right panel · drag a piece · R rotate · +/− scale · Del remove · ⌘Z undo"],
  ["Other", "L lighting · M mute · P photo · H hide UI · ? this help"],
];

function Dialogs() {
  const dialog = useGame((s) => s.dialog), quality = useGame((s) => s.quality), sensitivity = useGame((s) => s.sensitivity);
  return (
    <>
      <Dialog open={dialog === "settings"} onOpenChange={(o) => !o && useGame.setState({ dialog: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
          <label className="grid gap-1 text-sm">Quality
            <select className="rounded border bg-black/40 p-2" value={quality} onChange={(e) => useGame.getState().setQuality(+e.target.value as 0 | 1 | 2)}>
              <option value={0}>Low</option><option value={1}>Medium</option><option value={2}>High</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Look sensitivity
            <Slider min={0.25} max={2} step={0.05} value={[sensitivity]} onValueChange={(v) => useGame.setState({ sensitivity: one(v) })} />
          </label>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "controls"} onOpenChange={(o) => !o && useGame.setState({ dialog: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Controls</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            {CONTROLS.map(([t, b]) => <div key={t}><p className="font-bold text-cyan-300">{t}</p><p className="text-zinc-300">{b}</p></div>)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function useHudKeys() {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const s = useGame.getState();
      if (s.choosing || s.dialog) return;
      if (e.key === "l") s.cyclePreset();
      if (e.key === "h") useGame.setState({ hideUI: !s.hideUI });
      if (e.key === "p") takePhoto();
      if (e.key === "?" || e.key === "F1") { e.preventDefault(); useGame.setState({ dialog: "controls" }); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
}

function TurnSideways() {
  return (
    <div className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-3 bg-[#05020d]/95 p-6 text-center [@media(orientation:portrait)_and_(pointer:coarse)]:flex">
      <p className="text-3xl font-bold text-cyan-300">Turn your phone sideways</p>
      <p className="text-zinc-300">The room is best in landscape.</p>
    </div>
  );
}

function continueFlat() {
  const plan = useLayout.getState().plan;
  const pos = useGame.getState().roomPos;
  if (!plan) { useGame.setState({ choosing: false }); return; }
  const [x, z] = clampWalk(plan, pos[0], pos[2]);
  const y = Math.min(plan.h - 0.3, Math.max(0.4, pos[1] || 1.5));
  useGame.setState({ choosing: false, roomPos: [x, y, z] });
}

export function PlanPicker() {
  const choosing = useGame((s) => s.choosing);
  const name = useLayout((s) => s.name);
  const pieces = useLayout((s) => s.pieces);
  if (!choosing) return null;
  const furniture = Math.max(0, Object.keys(pieces).length - 1);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#05020d]/85 p-4 backdrop-blur-sm">
      <div className="grid max-h-[calc(100dvh-2rem)] w-full max-w-5xl gap-3 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300">Choose a floor plan</h1>
          <p className="text-sm text-zinc-400">Start an empty shell. Continue keeps the furniture already saved on this device.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {FLOORPLANS.map((p) => {
            const plan = p.build();
            return (
              <button key={p.id} type="button" onClick={() => useLayout.getState().applyPlanAction(p.id)}
                className="rounded-lg border border-cyan-400/40 bg-black/70 p-3 text-left hover:border-cyan-300">
                <PlanSketch plan={plan} />
                <p className="mt-2 font-bold text-cyan-200">{p.title}</p>
                <p className="text-xs text-fuchsia-300">{p.area}</p>
                <p className="mt-1 text-xs text-zinc-400">{p.blurb}</p>
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={continueFlat}>
          Continue · {name}{furniture > 0 ? ` · ${furniture} pieces` : ""}
        </Button>
      </div>
    </div>
  );
}

export function Hud() {
  useHudKeys();
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("my-flat-did-migrate")) {
      sessionStorage.removeItem("my-flat-did-migrate");
      toast.message("Started a new flat. The previous layout was the bedroom and was not kept.");
    }
    const g = useGame.getState();
    if (g.view !== "room") useGame.setState({ view: "room", title: false });
    else if (g.title) useGame.setState({ title: false });
  }, []);
  const hideUI = useGame((s) => s.hideUI), choosing = useGame((s) => s.choosing);
  return (
    <>
      <TurnSideways />
      <PlanPicker />
      <Dialogs />
      {!hideUI && !choosing && <LeftPanel />}
      {hideUI && !choosing && (
        <Button size="sm" className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2" onClick={() => useGame.setState({ hideUI: false })}>Show controls</Button>
      )}
    </>
  );
}
