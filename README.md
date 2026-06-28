# 2048 Grip

> 🎮 **Play live**: https://cadmusyiu.github.io/2048-merger/

A polished take on the classic sliding-number puzzle — merge equal tiles to work your way up to **2048** (and beyond). Built as a single self-contained HTML/CSS/JS page, no build step or dependencies.

## Features

- **Smooth sliding animation** — tiles glide, newly spawned tiles pop in, merged tiles bounce
- **Correct game-over detection** — knows when no moves remain (adjacent equal tiles / empty cells)
- **Win state at 2048** — celebrate, then keep playing for a higher score
- **Best score + top-5 high scores** — persisted in `localStorage`
- **Keyboard + touch** — arrow keys, WASD, or swipe
- **Fully responsive** — scales to any screen, mobile-friendly
- **Full tile palette** — distinct colors from `2` all the way up to `2048`+

## How to run

Open `index.html` in any modern browser, or play the [live demo](https://cadmusyiu.github.io/2048-merger/).

## Tech

Vanilla HTML / CSS / JavaScript — no frameworks, no dependencies.

## Tests

The core move/merge logic is DOM-free and unit-tested:

```bash
node test-logic.js
```

Covers: directional slides, single/double merges, the "no triple-merge" rule, win detection, and game-over locking.

## License

[MIT](./LICENSE)
