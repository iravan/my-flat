"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { kindOfPiece, liveHomes, poseOf, useLayout, type Pose } from "@/lib/room";
import { STYLE_IDS, STYLES } from "@/lib/styles";
import { finishDefaults } from "@/lib/config";
import { typing } from "@/lib/store";
import { Panel } from "./Panel";
import { CATALOGUE, catalogueEntry } from "@/lib/catalogue";
import { ROOM_BUDGET, useBudget } from "@/lib/budget";
import * as THREE from "three";
import { FINISHES, finishLabel, finishType, VARIANTS } from "@/lib/options";
import { VARIANTS as LOOKS } from "@/items/variants";
import { variantId } from "@/items/resolve";
import { pieceHome } from "@/lib/frame";
import { planArea } from "@/lib/flat-plan";

const STEP = Math.PI / 12;

function nameOf(id: string) {
  const s = useLayout.getState();
  const kind = kindOfPiece(id, s.pieces, s.models);
  return catalogueEntry(kind ?? "")?.label ?? kind ?? id;
}

function adjust(f: (p: Pose) => Pose) {
  const L = useLayout.getState(), id = L.selected, home = id && liveHomes.get(id);
  if (!id || !home) return;
  L.snapshot();
  L.move(id, f(poseOf(id, home)));
}
const rotate = (d: number) => adjust((p) => ({ ...p, rotationY: Math.round((p.rotationY + d) / STEP) * STEP }));
const resize = (k: number) => adjust((p) => ({ ...p, scale: Math.min(2, Math.max(0.5, Math.round(p.scale * k * 100) / 100)) }));

function useEditKeys() {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const L = useLayout.getState();
      if (!L.editing || typing(e)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); L.undo(); }
      else if (e.key === "r" || e.key === "R") rotate(e.shiftKey ? -STEP : STEP);
      else if (e.key === "=" || e.key === "+") resize(1.1);
      else if (e.key === "-") resize(1 / 1.1);
      else if ((e.key === "Delete" || e.key === "Backspace") && L.selected) {
        e.preventDefault();
        if (L.pieces[L.selected]) L.removePieceAction(L.selected);
      } else if (e.key === "Escape") useLayout.setState({ selected: null });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
}

function Options({ id, kind }: { id: string; kind: string }) {
  const slots = useLayout((s) => s.slots), opts = useLayout((s) => s.options[id]) ?? {}, def = finishDefaults(useLayout((s) => s.style), kind);
  const variants = VARIANTS[kind] ?? {};
  const set = (k: string, v: string) => useLayout.getState().setOption(id, k, v);
  return (
    <div className="space-y-2">
      {Object.entries(variants).map(([k, v]) => (
        <div key={k}>
          <p className="text-xs text-zinc-400">{v.label}</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(v.choices).map(([c, label]) => (
              <Button key={c} size="xs" variant={(opts[k] ?? Object.keys(v.choices)[0]) === c ? "default" : "outline"} onClick={() => set(k, c)}>{label}</Button>
            ))}
          </div>
        </div>
      ))}
      {slots.map((slot) => {
        const choices = FINISHES[finishType(slot)] ?? {}, current = opts[slot] ?? def[slot] ?? def[finishType(slot)] ?? "original";
        return (
          <div key={slot}>
            <p className="text-xs text-zinc-400">{finishLabel(slot)}: <span className="text-zinc-200">{choices[current]?.label}</span></p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(choices).map(([c, ch]) => (
                <button key={c} title={ch.label} aria-label={`${finishLabel(slot)} ${ch.label}`} onClick={() => set(slot, c)}
                  className={`size-6 rounded-full border ${current === c ? "border-2 border-cyan-300" : "border-white/30"}`}
                  style={{ background: ch.color ? `#${ch.color.getHexString(THREE.SRGBColorSpace)}` : "conic-gradient(#a77,#7a7,#77a,#a77)" }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Look({ id, kind }: { id: string; kind: string }) {
  const pick = useLayout((s) => s.options[id]?.look), style = useLayout((s) => s.style);
  const entry = catalogueEntry(kind);
  const looks = Object.values(LOOKS[kind] ?? {}).filter((v) => !entry?.looks || entry.looks.includes(v.id));
  const current = variantId(kind, id, { style, options: { [id]: { look: pick ?? "" } } });
  return (
    <div>
      <p className="text-xs text-zinc-400">Look: <span className="text-zinc-200">{looks.find((v) => v.id === current)?.name}</span></p>
      <div className="grid grid-cols-2 gap-1">
        {looks.map((v) => (
          <Button key={v.id} size="xs" variant={current === v.id ? "default" : "outline"} onClick={() => useLayout.getState().setLook(id, v.id)}>{v.name}</Button>
        ))}
      </div>
    </div>
  );
}

function BudgetMeter() {
  const u = useBudget();
  const rows: [string, number, number, string][] = [
    ["Triangles", u.triangles, ROOM_BUDGET.triangles, `${Math.round(u.triangles / 1000)}k`],
    ["Draw calls", u.draws, ROOM_BUDGET.draws, String(u.draws)],
    ["Textures", u.textureMB, ROOM_BUDGET.textureMB, `${u.textureMB} MB`],
  ];
  return (
    <div className="space-y-1 text-xs text-zinc-400" aria-label="Room budget">
      {rows.map(([label, v, max, text]) => (
        <div key={label}>
          <div className="flex justify-between"><span>{label}</span><span>{text} / {label === "Textures" ? `${max} MB` : label === "Triangles" ? `${max / 1000}k` : max}</span></div>
          <div className="h-1 rounded bg-white/10"><div className={`h-1 rounded ${v > max ? "bg-red-500" : v > max * 0.8 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${Math.min(100, (v / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function Catalogue() {
  const groups: Record<string, typeof CATALOGUE> = { Floor: [], Wall: [], Ceiling: [] };
  for (const e of CATALOGUE) {
    if (e.opening) continue;
    if (e.mount === "floor") groups.Floor.push(e);
    else if (e.mount === "wall") groups.Wall.push(e);
    else groups.Ceiling.push(e);
  }
  const add = (kind: string) => {
    const id = useLayout.getState().addPieceAction(kind);
    if (!id) toast.error("Could not add that piece (cap or limit reached).");
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-cyan-300">Add furniture</p>
      {Object.entries(groups).map(([label, rows]) => rows.length > 0 && (
        <div key={label}>
          <p className="text-[11px] text-zinc-500">{label}</p>
          <div className="grid grid-cols-2 gap-1">
            {rows.map((e) => (
              <Button key={e.kind} size="xs" variant="outline" onClick={() => add(e.kind)}>{e.label}</Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StylePicker() {
  const current = useLayout((s) => s.style);
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-cyan-300">Style: <span className="text-zinc-200">{STYLES[current].name}</span></p>
      <div className="grid grid-cols-2 gap-1">
        {STYLE_IDS.map((id) => (
          <button key={id} onClick={() => useLayout.getState().setStyle(id)} title={STYLES[id].blurb}
            className={`flex items-center gap-1.5 rounded border px-1.5 py-1 text-left text-[11px] ${id === current ? "border-cyan-300 bg-white/10 text-white" : "border-white/15 text-zinc-300 hover:bg-white/5"}`}>
            <span className="flex shrink-0">{STYLES[id].swatch.map((c) => <span key={c} className="-mr-1 size-3 rounded-full border border-black/40" style={{ background: c }} />)}</span>
            <span className="ml-1 truncate">{STYLES[id].name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditPanel() {
  useEditKeys();
  const selected = useLayout((s) => s.selected), canUndo = useLayout((s) => s.past.length > 0);
  const pieces = useLayout((s) => s.pieces);
  const plan = useLayout((s) => s.plan);
  const kind = selected ? kindOfPiece(selected, pieces, useLayout.getState().models) : undefined;
  const entry = kind ? catalogueEntry(kind) : undefined;
  const home = kind ? pieceHome(kind) : undefined;
  const wallish = entry?.mount === "wall" || entry?.opening;

  return (
    <Panel side="right">
      <p><b className="text-cyan-300">Place furniture</b><br /><span className="text-zinc-400">
        {selected
          ? (wallish ? "Drag to slide along the wall." : "Drag to move on the floor. Shift = fine steps.")
          : "Add a piece, or drag a piece to move it. Drag empty space to look."}
      </span></p>
      {selected && kind && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold text-fuchsia-400">{nameOf(selected)}</p>
            <Button size="xs" variant="ghost" aria-label="Deselect" title="Deselect [Esc]" onClick={() => useLayout.setState({ selected: null })}>✕</Button>
          </div>
          {!wallish && (
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="secondary" onClick={() => rotate(STEP)}>⟲ Rotate [R]</Button>
              <Button size="sm" variant="secondary" onClick={() => rotate(-STEP)}>⟳ Rotate [⇧R]</Button>
            </div>
          )}
          {entry?.kind !== "ceiling-light" && !entry?.opening && (
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="secondary" onClick={() => resize(1 / 1.1)}>Smaller [−]</Button>
              <Button size="sm" variant="secondary" onClick={() => resize(1.1)}>Bigger [+]</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" onClick={() => { const id = useLayout.getState().duplicatePieceAction(selected); if (!id) toast.error("Could not duplicate."); }}>Add another</Button>
            <Button size="sm" variant="destructive" onClick={() => useLayout.getState().removePieceAction(selected)}>Remove [Del]</Button>
          </div>
          <Options id={selected} kind={kind} />
          <Look id={selected} kind={kind} />
          {home && null}
        </>
      )}
      {!selected && <Catalogue />}
      {!selected && <StylePicker />}
      {!selected && (
        <p className="text-xs text-zinc-500">
          {plan ? `${plan.name} — ${planArea(plan).toFixed(1)} m²` : ""}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" disabled={!canUndo} onClick={() => useLayout.getState().undo()}>Undo [⌘Z]</Button>
        <Button size="sm" variant="outline" onClick={() => useLayout.getState().clearFurnitureAction()}>Clear furniture</Button>
      </div>
      <Button size="sm" variant="outline" onClick={() => useLayout.getState().resetFlatAction()}>Reset flat</Button>
      <BudgetMeter />
    </Panel>
  );
}
