# My Flat

Place each piece of furniture when you move into a new flat. Walk the room and drag furniture until the layout feels right.

Forked from [My Room](https://github.com/iravan/my-room). The scene is still that bedroom; the flat design comes next. Saves use their own keys (`my-flat` in this browser), so the two apps do not share a layout.

Live at https://iravan.github.io/my-flat/.

## What you can do today

The tools from My Room are already here, and the flat planner will build on them:

- **Move furniture** — select, drag, rotate, resize, snap, undo
- **Walk around** — drag to look, WASD / touch stick
- **Room options** — lighting, materials, room size, uploaded GLB models
- **Local-first** — the layout stays in this browser

The vinyl bedroom (turntable, crate, albums) is still in this build until the new design replaces it.

## Stack

| Area | Tech |
| --- | --- |
| App | Next.js 16, React 19, TypeScript |
| 3D | React Three Fiber, drei, three.js, postprocessing |
| State | Zustand (persisted) |
| UI | Tailwind CSS 4, shadcn/ui |
| Audio | Web Audio API |
| Backend | Supabase (rooms, albums, storage, RLS) |

## Quick start

```sh
cd web
bun install
bun run dev     # http://localhost:3000
```

Requires **Bun 1.4**. Useful scripts:

```sh
bun run build
bun run test    # Vitest: collection, sharing, visitor mode, models
bun run check   # headless Chrome: screenshots, drag artifact scan, FPS
```

More notes live in [`web/README.md`](web/README.md).

## Repo layout

```
web/          Next.js app (the game)
supabase/     Schema, storage bucket, RLS + policy tests
```

## Docs

These notes describe the bedroom this project was forked from.

| File | What it is |
| --- | --- |
| [`game_design_document_visual_vinyl_showcase.md`](game_design_document_visual_vinyl_showcase.md) | Original design doc |
| [`MIGRATION.md`](MIGRATION.md) | Unity → web rebuild checklist |
| [`REALISM.md`](REALISM.md) | Per-item realism pass |
| [`CUSTOMIZATION.md`](CUSTOMIZATION.md) | Room options and model upload plan |

The original Unity build is kept at git tag `unity-final` (`git checkout unity-final`).

## License

Texture packs under `web/public/textures/` include their own CC0 / license notes.
