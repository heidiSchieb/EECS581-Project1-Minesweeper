<!--
Document: Setup and play guide for EECS 581 Project 2 Minesweeper.
Inputs: Project setup and implemented game behavior.
Output: Instructions for running, playing, and testing the game.
Authors: Alica Mungamuri & Audrey Facer (UI); Lilly Tran & Heidi Schieber
(player-vs-AI); Zain Cheema and Ibaad Khatib (automatic AI-solving).
External sources: Project requirements; OpenAI Copilot assisted with documentation.
Updated: 2026-10-10
-->
# EECS 581 Project 2: Minesweeper

This project builds on Group 19's Minesweeper with AI play, a safer first reveal, and loss animations and sound.

## Run the game

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL shown in the terminal.

## Play

1. Choose 10–20 mines and a play mode: **Player only**, **Player + AI**, or **AI solves board**.
2. Choose an AI difficulty when using an AI mode: **Easy**, **Medium**, or **Hard**.
3. Left-click a cell to reveal it. Right-click or press **F** on a focused cell to flag or unflag it.
4. Reveal every safe cell to win. Flags cannot exceed the number of mines.

The first reveal opens a clear area. In **Player + AI**, the AI takes a turn after each changed player move. **AI solves board** runs until the game ends or you stop it.

If a player or AI uncovers a mine, the game marks the cell, plays a sound, shakes the board, and shows an explosion animation.

## Tests and docs

- `npm test` — run AI solver tests.
- `npm run typecheck` — check application and test types.
- `npm run build` — typecheck and build the app.
- `npm run preview` — preview the production build.

See [the system architecture](./docs/Updated-Architecture.md) and [the custom-feature UML](./docs/new-feature-uml.md).
