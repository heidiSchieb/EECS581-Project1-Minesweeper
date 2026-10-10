# EECS 581 Project 2

**Course:** EECS 581 - Software Engineering II  
**Semester:** Fall 2026  
**Instructor:** Professor Hossein Saiedian

This project extends the functionality of Group 19's original work
- Adds ability to play against an AI
- Adds auto solving AI
- Adds new UI features
- Fixes bugs from previous


## Minesweeper setup info

### How to run our repo

Requires Node.js 20.19+ or 22.12+.

```sh
git clone [repo]
cd [repo]
npm ci
npm run dev
```

Open the URL printed in the terminal. Press Ctrl+C to stop.

- `npm run typecheck` — check types.
- `npm run build` — check types and build to `dist/`.
- `npm run preview` — preview the build locally.

## Play

Choose 10–20 mines and select **Start round**. Left-click to reveal; right-click or press F on a focused cell to toggle a flag. Reveal all safe cells to win. The first reveal always opens a clear area around the selected cell; any flags in that guaranteed-safe area are removed.
- Option to select an AI difficulty to play against
- Option to see and AI solve the board itself

Flags are capped at the chosen mine count. **Mines left** shows flags remaining. Unflag a cell before revealing it. **New Game** returns to setup; refreshing resets the game.


## Source

| File | Purpose |
| --- | --- |
| [UserInterface.tsx](./src/UserInterface.tsx) | React state and screen layout |
| [components/](./src/components/) | Board and setup controls |
| [inputHandler.ts](./src/inputHandler.ts) | Input validation and command dispatch |
| [gameLogic.ts](./src/gameLogic.ts) | Start, reveal, flags, flood fill, and win/loss rules |
| [boardManager.ts](./src/boardManager.ts) | Board operations, mines, and neighbor counts |
| [types.ts](./src/types.ts) | Shared types and constants |
| [main.tsx](./src/main.tsx) / [styles.css](./src/styles.css) | Entry point and styling |

View [System architecture](./docs)