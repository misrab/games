# Games

Vite + TypeScript. Routes: `#/` hub, `#/<id>` game. Each game loads with `import()`.

Visible words live in `src/i18n/en.json` and go through `t()`. Add a locale file later; do not hardcode UI strings. Tags are ids (`spatial`) shown as `t('tag.spatial')`.

Colours are CSS variables in `src/core/theme.css`. `[data-theme="dark"|"light"]` on `<html>`. A game may set extra variables on its own root. Corners are square: no `border-radius`, and maze cells are rectangles.

Browser storage is `localStorage` key `games-hub-v1`: `{ theme, games }`. `theme` is `dark` or `light` (default `dark`). Each game stores `{ best, plays, settings }`.

## Add a game

1. `src/games/<id>/` with `logic.ts` (no DOM), `render.ts` (drawing only), `index.ts` (default export `Game`).
2. Strings in `src/i18n/en.json`, including `tag.*` if you add a tag.
3. One entry in `src/registry.ts`: `id`, `titleKey`, `instructionsKey`, `tags`, optional `settings`, `load`.
4. `make test` for `logic.ts`.

The shell (`src/core/shell.ts`) is the same for every game: Back, title, collapsed How to play, collapsed Settings. Settings always include theme. Extra rows are the game's `settings` list (`id`, `labelKey`, `default`, `options`). The shell passes the chosen map as `opts.settings` and does not know what the ids mean. The game fills the space under that chrome and brings its own controls.

## Chicken Pursuit

Race the other chicken to the corn. The yard turns; directions stay tied to the screen. The pad sits under the board. Setting `pace` (`easy` | `normal` | `hard`) sets maze size, turn speed, and rival speed.

## Void Run

Fly with WASD, arrows, or a drag. The pointer aims. Hold Space or the press to fire. A click does not move the ship. `best` is the score for that run.
