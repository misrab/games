# Games

Vite + TypeScript. Hash routes: `#/` hub, `#/<id>` a game. Games load with `import()` so a heavy renderer only downloads when that game opens.

## Add a game

1. `src/games/<id>/` — `logic.ts` (rules only, no DOM), `render.ts` (drawing only), `index.ts` (default-export `Game`: `mount` / `unmount`).
2. Copy in `src/i18n/en.json`. No hardcoded UI strings. Colours from `src/core/theme.css` variables only.
3. Register one line in `src/registry.ts`: `id`, `titleKey`, `tags`, `load`.
4. Test `logic.ts` with Vitest. `make test`.

## Layout

Fill `100dvh`. Pad with `safe-area-inset`. Keyboard and a touch control both work. Size a square board with `container-type: size` so the same layout fits a phone and a desktop.

## Penguin Pursuit

You and a rival race to the fish. The maze turns. Arrows and the pad stay tied to the screen, so after a turn the same key walks a different corridor. A mark on the maze shows which way was north. The bar under the title fills until the next turn. The rival walks the shortest path, slower than a player who keeps moving.
