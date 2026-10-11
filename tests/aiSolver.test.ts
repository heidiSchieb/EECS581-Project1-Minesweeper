/**
 * File: tests/aiSolver.test.ts
 * Description: Verifies Easy/Medium/Hard solver decisions and loss coordinates.
 * Inputs: Deterministic board fixtures and injected random sources.
 * Outputs: Node test results; assertions verify solver state transitions.
 * Project 2 user-versus-AI attribution: Lilly T & Heidi S.
 * Project 2 automatic-solving attribution: Zain C and Ibaad K.
 * External sources: Node.js built-in node:test and node:assert/strict APIs;
 * OpenAI Copilot assisted with test implementation.
 * Created: 2026-10-10
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateAdjacentMines, createBoard } from "../src/boardManager.ts";
import { makeAiMove, makeAiTurn } from "../src/aiSolver.ts";
import type { Board, GameState, Position, Visibility } from "../src/types.ts";

interface FixtureOptions {
  readonly mines: readonly Position[];
  readonly covered?: readonly Position[];
  readonly flagged?: readonly Position[];
  readonly revealed?: readonly Position[];
  readonly revealAllSafe?: boolean;
}

function key(position: Position): string {
  return `${position.row}:${position.column}`;
}

function makeState({
  mines,
  covered = [],
  flagged = [],
  revealed = [],
  revealAllSafe = false,
}: FixtureOptions): GameState {
  const mineKeys = new Set(mines.map(key));
  const coveredKeys = new Set(covered.map(key));
  const flaggedKeys = new Set(flagged.map(key));
  const revealedKeys = new Set(revealed.map(key));
  const boardWithMines: Board = createBoard().map((row, rowIndex) =>
    row.map((cell, columnIndex) => ({
      ...cell,
      hasMine: mineKeys.has(`${rowIndex}:${columnIndex}`),
    })),
  );
  const boardWithCounts = calculateAdjacentMines(boardWithMines);
  const board: Board = boardWithCounts.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      const positionKey = `${rowIndex}:${columnIndex}`;
      let visibility: Visibility = revealAllSafe && !cell.hasMine ? "revealed" : "covered";
      if (coveredKeys.has(positionKey)) visibility = "covered";
      if (flaggedKeys.has(positionKey)) visibility = "flagged";
      if (revealedKeys.has(positionKey)) visibility = "revealed";
      return { ...cell, visibility };
    }),
  );
  const flagsPlaced = board.flat().filter((cell) => cell.visibility === "flagged").length;
  const revealedSafeCount = board
    .flat()
    .filter((cell) => !cell.hasMine && cell.visibility === "revealed").length;

  return {
    board,
    mineCount: mines.length,
    flagsPlaced,
    revealedSafeCount,
    firstRevealDone: true,
    status: "playing",
  };
}

function runPatternCase(
  orientation: "horizontal" | "vertical",
  targetSide: "before" | "after",
): void {
  const cluePositions: Position[] = orientation === "horizontal"
    ? [0, 1, 2].map((offset) => ({ row: 4, column: 3 + offset }))
    : [0, 1, 2].map((offset) => ({ row: 3 + offset, column: 4 }));
  const targetIndex = targetSide === "before" ? -1 : 1;
  const targets: Position[] = orientation === "horizontal"
    ? [0, 1, 2].map((offset) => ({ row: 4 + targetIndex, column: 3 + offset }))
    : [0, 1, 2].map((offset) => ({ row: 3 + offset, column: 4 + targetIndex }));
  const state = makeState({
    mines: [targets[0]!, targets[2]!],
    covered: targets,
    revealed: cluePositions,
    revealAllSafe: true,
  });

  const result = makeAiMove(state, "hard", () => 0);

  assert.equal(result.board[targets[0]!.row]![targets[0]!.column]!.visibility, "flagged");
  assert.equal(result.board[targets[2]!.row]![targets[2]!.column]!.visibility, "flagged");
  assert.equal(result.board[targets[1]!.row]![targets[1]!.column]!.visibility, "revealed");
  assert.equal(result.flagsPlaced, 2);
}

describe("makeAiMove", () => {
  it("Easy selects only a covered cell and does not touch flags or revealed cells", () => {
    const state = makeState({
      mines: [{ row: 0, column: 0 }, { row: 6, column: 7 }],
      flagged: [{ row: 0, column: 0 }, { row: 6, column: 7 }],
      covered: [{ row: 5, column: 5 }, { row: 6, column: 6 }],
      revealAllSafe: true,
    });

    const result = makeAiMove(state, "easy", () => 0.75);

    assert.equal(result.board[6]![6]!.visibility, "revealed");
    assert.equal(result.board[5]![5]!.visibility, "covered");
    assert.equal(result.board[0]![0]!.visibility, "flagged");
    assert.equal(result.flagsPlaced, 2);
  });

  it("Medium flags all covered neighbors when all remaining neighbors must be mines", () => {
    const state = makeState({
      mines: [{ row: 0, column: 1 }, { row: 1, column: 0 }],
      revealed: [{ row: 0, column: 0 }, { row: 1, column: 1 }],
    });

    const result = makeAiMove(state, "medium", () => 0);

    assert.equal(result.board[0]![1]!.visibility, "flagged");
    assert.equal(result.board[1]![0]!.visibility, "flagged");
    assert.equal(result.flagsPlaced, 2);
  });

  it("Medium opens covered neighbors when all adjacent mines are flagged", () => {
    const state = makeState({
      mines: [{ row: 0, column: 1 }],
      flagged: [{ row: 0, column: 1 }],
      covered: [{ row: 1, column: 0 }],
      revealed: [{ row: 0, column: 0 }],
    });

    const result = makeAiMove(state, "medium", () => 0);

    assert.equal(result.board[1]![0]!.visibility, "revealed");
    assert.equal(result.board[0]![1]!.visibility, "flagged");
    assert.equal(result.flagsPlaced, 1);
  });

  it("Medium falls back to a random covered cell when no rule applies", () => {
    const clue = { row: 0, column: 0 };
    const firstChoice = { row: 0, column: 1 };
    const secondChoice = { row: 1, column: 0 };
    const state = makeState({
      mines: [{ row: 0, column: 1 }],
      covered: [firstChoice, secondChoice],
      revealed: [
        clue,
        { row: 0, column: 2 },
        { row: 1, column: 1 },
      ],
    });
    const coveredCount = state.board.flat().filter((cell) => cell.visibility === "covered").length;
    const selectedIndex = state.board.flatMap((row, rowIndex) =>
      row.map((cell, columnIndex) =>
        cell.visibility === "covered" ? { row: rowIndex, column: columnIndex } : null,
      ),
    ).filter((position) => position !== null).findIndex(
      (position) => position.row === secondChoice.row && position.column === secondChoice.column,
    );
    assert.notEqual(selectedIndex, -1);
    const randomValue = (selectedIndex + 0.1) / coveredCount;

    const result = makeAiMove(state, "medium", () => randomValue);

    assert.equal(result.board[secondChoice.row]![secondChoice.column]!.visibility, "revealed");
    assert.equal(result.board[firstChoice.row]![firstChoice.column]!.visibility, "covered");
  });

  it("Hard applies the 1-2-1 deduction horizontally and vertically on either side", () => {
    runPatternCase("horizontal", "before");
    runPatternCase("horizontal", "after");
    runPatternCase("vertical", "before");
    runPatternCase("vertical", "after");
  });

  it("Hard still applies Medium rules when no 1-2-1 pattern exists", () => {
    const state = makeState({
      mines: [{ row: 0, column: 1 }],
      flagged: [{ row: 0, column: 1 }],
      covered: [{ row: 1, column: 0 }],
      revealed: [{ row: 0, column: 0 }],
    });

    const result = makeAiMove(state, "hard", () => 0);

    assert.equal(result.board[1]![0]!.visibility, "revealed");
  });

  it("does not make a move after the game ends or when no covered cell remains", () => {
    const ended = makeState({ mines: [{ row: 0, column: 0 }] });
    const won: GameState = { ...ended, status: "won" };
    const noCoveredCells = makeState({
      mines: [{ row: 0, column: 0 }],
      flagged: [{ row: 0, column: 0 }],
      revealAllSafe: true,
    });

    assert.equal(makeAiMove(won, "hard"), won);
    assert.equal(makeAiMove(noCoveredCells, "easy"), noCoveredCells);
  });

  it("rejects an invalid random source when a fallback choice is needed", () => {
    const state = makeState({ mines: [{ row: 0, column: 0 }] });

    assert.throws(() => makeAiMove(state, "easy", () => 1), RangeError);
  });

  it("reports the detonated cell when an AI move loses", () => {
    const mine = { row: 0, column: 0 };
    const state = makeState({
      mines: [mine],
      covered: [mine],
      revealAllSafe: true,
    });

    const result = makeAiTurn(state, "easy", () => 0);

    assert.equal(result.state.status, "lost");
    assert.deepEqual(result.detonatedPosition, mine);
  });
});
