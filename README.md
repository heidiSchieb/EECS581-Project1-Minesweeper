<!--
Document: Project 2 setup, gameplay, feature, and source guide.
Inputs: Project configuration and implemented game behavior.
Output: Setup, usage, testing, and feature-reference documentation.
Authors: Alice M & Audrey F (UI); Lilly T & Heidi S (player-vs-AI);
Zain C and Ibaad K (automatic AI-solving).
External sources: Assignment requirements and linked source/assets in this repository;
OpenAI Copilot assisted with Project 2 documentation updates.
Updated: 2026-10-10
-->
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
- `npm test` — run the AI solver unit tests.
- `npm run build` — check types and build to `dist/`.
- `npm run preview` — preview the build locally.

## Play

Choose 10–20 mines and select **Start round**. Left-click to reveal; right-click or press F on a focused cell to toggle a flag. Reveal all safe cells to win. The first reveal always opens a clear area around the selected cell; any flags in that guaranteed-safe area are removed.

Choose **Player only**, **Player + AI**, or **AI solves board**. Interactive play alternates one AI response after each changed player move; automatic solving continues until the game ends or you stop it. Easy chooses a random covered cell, Medium applies the two neighbor-count rules before random fallback, and Hard additionally applies a validated 1-2-1 pattern deduction.

Flags are capped at the chosen mine count. **Mines left** shows flags remaining. Unflag a cell before revealing it. **New Game** returns to setup; refreshing resets the game.

## Project 2 custom feature

The custom feature required for this project is the loss-effect feedback: when a player or the AI uncovers a mine, the game identifies the detonated cell, plays the explosion sound, shakes the game panel, and displays the explosion animation. The effects are shared by player and AI losses so the outcome is communicated consistently in every play mode. See [the UML sequence diagram](./docs/new-feature-uml.md).


## Source

| File | Purpose |
| --- | --- |
| [UserInterface.tsx](./src/UserInterface.tsx) | React state and screen layout |
| [components/](./src/components/) | Board and setup controls |
| [inputHandler.ts](./src/inputHandler.ts) | Input validation and command dispatch |
| [gameLogic.ts](./src/gameLogic.ts) | Start, reveal, flags, flood fill, and win/loss rules |
| [boardManager.ts](./src/boardManager.ts) | Board operations, mines, and neighbor counts |
| [aiSolver.ts](./src/aiSolver.ts) | Easy, Medium, and Hard AI move selection and deductions |
| [types.ts](./src/types.ts) | Shared types and constants |
| [tests/](./tests/) | AI solver unit tests |
| [main.tsx](./src/main.tsx) / [styles.css](./src/styles.css) | Entry point and styling |

View [System architecture](./docs)