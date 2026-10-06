# games

Browser mini-games hub — live at [games.misrab.xyz](https://games.misrab.xyz).

Open source; contributions welcome (issues and pull requests). See [LICENSE](LICENSE) (MIT).

## Stack

Vite, TypeScript, no UI framework. Game logic is covered by Vitest where it matters.

## Develop

Requires Node.js and npm.

```bash
make install
make dev
```

Other commands: `make test`, `make build`, `make preview`, `make clean` (or the matching `npm run` scripts).

## Layout

- `src/registry.ts` — game list and lazy loads
- `src/games/<id>/` — each game
- `src/core/` — hub, shell, i18n, storage, shared loop/input
- `src/i18n/en.json` — user-facing copy
- `src/hub/hub.ts` — hub card marks (one SVG per game id)

## Adding a game

1. Add `src/games/<id>/` and wire it in `src/registry.ts`.
2. Add strings in `src/i18n/en.json`.
3. Add a hub mark in `src/hub/hub.ts`.
4. Ship desktop (keyboard/mouse) and touch controls; keep copy in `controlsKey.desktop` / `controlsKey.touch` accurate.
