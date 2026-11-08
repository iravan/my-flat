"use client";

import { planBounds, roomBounds, type FlatPlan, type Partition, type PlanWindow } from "@/lib/flat-plan";

type Hole = { at: number; width: number };

function cuts(from: number, to: number, holes: Hole[]): [number, number][] {
  let parts: [number, number][] = [[from, to]];
  for (const h of holes) {
    const g0 = h.at - h.width / 2, g1 = h.at + h.width / 2;
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (g1 <= p0 || g0 >= p1) { next.push([p0, p1]); continue; }
      if (g0 > p0) next.push([p0, g0]);
      if (g1 < p1) next.push([g1, p1]);
    }
    parts = next;
  }
  return parts.filter(([a, c]) => c - a > 0.04);
}

/** Shared room edges that are not a real wall, drawn dashed so the zones stay readable. */
function zoneLines(plan: FlatPlan): { axis: "x" | "z"; fixed: number; from: number; to: number }[] {
  const out: { axis: "x" | "z"; fixed: number; from: number; to: number }[] = [];
  const rooms = plan.rooms;
  const walled = (axis: "x" | "z", fixed: number, from: number, to: number) =>
    plan.partitions.some((p) => p.axis === axis && Math.abs(p.fixed - fixed) < 1e-6 && Math.min(p.to, to) - Math.max(p.from, from) > 0.05);
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = roomBounds(rooms[i]), b = roomBounds(rooms[j]);
      if (Math.abs(a.x1 - b.x0) < 1e-6 || Math.abs(b.x1 - a.x0) < 1e-6) {
        const x = Math.abs(a.x1 - b.x0) < 1e-6 ? a.x1 : a.x0;
        const z0 = Math.max(a.z0, b.z0), z1 = Math.min(a.z1, b.z1);
        if (z1 - z0 > 0.2 && !walled("z", x, z0, z1)) out.push({ axis: "z", fixed: x, from: z0, to: z1 });
      }
      if (Math.abs(a.z1 - b.z0) < 1e-6 || Math.abs(b.z1 - a.z0) < 1e-6) {
        const z = Math.abs(a.z1 - b.z0) < 1e-6 ? a.z1 : a.z0;
        const x0 = Math.max(a.x0, b.x0), x1 = Math.min(a.x1, b.x1);
        if (x1 - x0 > 0.2 && !walled("x", z, x0, x1)) out.push({ axis: "x", fixed: z, from: x0, to: x1 });
      }
    }
  }
  return out;
}

function labelSize(name: string, w: number, d: number) {
  const longest = Math.max(...name.split(" · ").map((s) => s.length), 1);
  return Math.max(0.16, Math.min(0.36, (w * 0.86) / (longest * 0.55), d * 0.4));
}

/** A line plan of one flat: north at the top, walls solid, open zone edges dashed, windows in cyan. */
export function PlanSketch({ plan }: { plan: FlatPlan }) {
  const b = planBounds(plan);
  const pad = 0.62;
  const X = (x: number) => x - b.x0 + pad;
  const Y = (z: number) => z - b.z0 + pad;
  const vbW = b.w + pad * 2;
  const vbH = b.d + pad * 2;
  const on = (side: PlanWindow["wall"]) => plan.windows.filter((w) => w.wall === side);

  const hLines = (z: number, x0: number, x1: number, holes: Hole[], key: string) =>
    cuts(x0, x1, holes).map(([a, c], i) => <line key={`${key}-${i}`} x1={X(a)} y1={Y(z)} x2={X(c)} y2={Y(z)} />);
  const vLines = (x: number, z0: number, z1: number, holes: Hole[], key: string) =>
    cuts(z0, z1, holes).map(([a, c], i) => <line key={`${key}-${i}`} x1={X(x)} y1={Y(a)} x2={X(x)} y2={Y(c)} />);

  const partLines = (p: Partition, i: number) =>
    p.axis === "x" ? hLines(p.fixed, p.from, p.to, p.gaps ?? [], `p${i}`) : vLines(p.fixed, p.from, p.to, p.gaps ?? [], `p${i}`);

  const glass = (w: PlanWindow, i: number) => {
    const half = w.width / 2;
    if (w.wall === "n" || w.wall === "s") {
      const z = w.wall === "n" ? b.z0 : b.z1;
      return <line key={i} x1={X(w.at - half)} y1={Y(z)} x2={X(w.at + half)} y2={Y(z)} />;
    }
    const x = w.wall === "w" ? b.x0 : b.x1;
    return <line key={i} x1={X(x)} y1={Y(w.at - half)} x2={X(x)} y2={Y(w.at + half)} />;
  };

  const hinge = plan.entrance.x - plan.entrance.width / 2;
  const leaf = plan.entrance.width;

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-44 w-full rounded bg-zinc-950" role="img" aria-label={`${plan.name} floor plan`}>
      {plan.rooms.map((r) => {
        const rb = roomBounds(r);
        return <rect key={r.id} x={X(rb.x0)} y={Y(rb.z0)} width={r.w} height={r.d} fill="#ffffff0d" />;
      })}
      <g stroke="#71717a" strokeWidth={0.04} strokeDasharray="0.14 0.1" fill="none">
        {zoneLines(plan).map((e, i) => e.axis === "x"
          ? <line key={i} x1={X(e.from)} y1={Y(e.fixed)} x2={X(e.to)} y2={Y(e.fixed)} />
          : <line key={i} x1={X(e.fixed)} y1={Y(e.from)} x2={X(e.fixed)} y2={Y(e.to)} />)}
      </g>
      <g stroke="#f4f4f5" strokeWidth={0.14} strokeLinecap="square" fill="none">
        {hLines(b.z0, b.x0, b.x1, [{ at: plan.entrance.x, width: plan.entrance.width }, ...on("n")], "n")}
        {hLines(b.z1, b.x0, b.x1, on("s"), "s")}
        {vLines(b.x0, b.z0, b.z1, on("w"), "w")}
        {vLines(b.x1, b.z0, b.z1, on("e"), "e")}
        {plan.partitions.map(partLines)}
      </g>
      <g stroke="#67e8f9" strokeWidth={0.1} fill="none">
        {plan.windows.map(glass)}
      </g>
      <g stroke="#d4d4d8" fill="none" strokeWidth={0.045}>
        <line x1={X(hinge)} y1={Y(b.z0)} x2={X(hinge)} y2={Y(b.z0 + leaf)} />
        <path d={`M ${X(hinge + leaf)} ${Y(b.z0)} A ${leaf} ${leaf} 0 0 1 ${X(hinge)} ${Y(b.z0 + leaf)}`} />
      </g>
      {plan.rooms.map((r) => {
        const lines = r.name.split(" · ");
        const size = labelSize(r.name, r.w, r.d);
        return (
          <text key={r.id} x={X(r.x)} y={Y(r.z)} textAnchor="middle" dominantBaseline="middle" fill="#e4e4e7" fontSize={size} fontFamily="ui-sans-serif, system-ui, sans-serif">
            {lines.length === 1 ? lines[0] : lines.map((line, i) => (
              <tspan key={line} x={X(r.x)} dy={i === 0 ? `${-(lines.length - 1) * 0.55}em` : "1.1em"}>{line}</tspan>
            ))}
          </text>
        );
      })}
      <text x={vbW / 2} y={0.32} textAnchor="middle" fill="#a1a1aa" fontSize={0.28} fontFamily="ui-sans-serif, system-ui, sans-serif">N</text>
    </svg>
  );
}
