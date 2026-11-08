# My Flat

Place furniture in a 清水樓 — a bare Hong Kong shell unit (~35 m²): only the kitchen and bath are walled, the rest is one open space for you to lay out. Add pieces from the catalogue, drag and rotate them, and walk the unit to check fit and perspective.

Local-first: the layout stays in this browser. No accounts, no GLB upload — new furniture is added as meshes over time.

Live at https://iravan.github.io/my-flat/.

## Stack

| Area | Tech |
| --- | --- |
| App | Next.js 16, React 19, TypeScript |
| 3D | React Three Fiber, drei, three.js, postprocessing |
| State | Zustand (persisted) |
| UI | Tailwind CSS 4, shadcn/ui |

## Quick start

```sh
cd web
bun install
bun run dev     # http://localhost:3000
```

Requires **Bun 1.4**.

```sh
bun run build
bun run test
bun run check   # headless Chrome screenshot + FPS
```

## Docs

| File | What it is |
| --- | --- |
| [`design.md`](design.md) | v1 plan |

## License

Texture packs under `web/public/textures/` include their own CC0 / license notes.
