/**
 * Module: gameLogic: start, uncover, flag, flood fill, and win/loss rules
 * Inputs: Mine count, GameState, Position, optional RandomSource
 * Outputs: ActionResult with updated/unchanged state or a validation error
 * Authors: Anh Hoang (setup/consolidation); Montaha Jornaz (flags); Rijul Poudel (uncover, flood fill, win/loss)
 * Created: 2026-09-10 
 */
import {
  createBoardWithMines, exposeAllMines, getCell, getNeighbors,
  isValidPosition, makeFirstRevealAreaSafe, updateCell,
} from "./boardManager.ts";
import {
  MIN_MINES, MAX_MINES,
  type ActionResult, type Board, type GameState, type Position, type RandomSource,
} from "./types.ts";

/** Public player commands, shared by the input handler and other callers. */
export interface GameLogic {
  startGame(mineCount: number, random?: RandomSource): ActionResult;
  uncover(state: GameState, position: Position, random: RandomSource): ActionResult;
  toggleFlag(state: GameState, position: Position): ActionResult;
}

/** Validate configuration before creating a new game; errors leave the caller's state intact. */
export function startGame(
  mineCount: number,
  random: RandomSource = Math.random,
): ActionResult {
  if (!Number.isInteger(mineCount) || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    return {
      ok: false,
      code: "INVALID_MINE_COUNT",
      message: `Enter an integer mine count from ${MIN_MINES} through ${MAX_MINES}.`,
    };
  }

  return {
    ok: true,
    changed: true,
    state: {
      board: createBoardWithMines(mineCount, random),
      mineCount,
      flagsPlaced: 0,
      revealedSafeCount: 0,
      firstRevealDone: false,
      status: "playing",
    },
  };
}

/** Rejection payload shared by every command that receives out-of-board coordinates. */
function invalidPosition(): ActionResult {
  return {
    ok: false,
    code: "INVALID_POSITION",
    message: "Cell coordinates must be integers from 0 through 9.",
  };
}

/** Return a successful no-op with the original state, such as a repeated reveal. */
function unchanged(state: GameState): ActionResult {
  return { ok: true, changed: false, state };
}

/** Open a cell action*/
export function uncover(
  state: GameState,
  position: Position,
  random: RandomSource = Math.random,
): ActionResult {
  //1.1 Check if action is valid
  if (!isValidPosition(position)) return invalidPosition();

  //1.2 Check if game state is changable
  if (state.status !== "playing") return unchanged(state);
  const cell = getCell(state.board, position);
  if (cell.visibility !== "covered") return unchanged(state);

  // 2. Protect first click
  let board = state.firstRevealDone
    ? state.board
    : makeFirstRevealAreaSafe(state.board, position, random);
  let flagsPlaced = state.flagsPlaced;

  if (!state.firstRevealDone) {
    for (const safePosition of [position, ...getNeighbors(position)]) {
      if (getCell(board, safePosition).visibility === "flagged") {
        board = updateCell(board, safePosition, { visibility: "covered" });
        flagsPlaced--;
      }
    }
  }

  // 3. Check for a mine after first-reveal protection.
  if (getCell(board, position).hasMine) { //If user click on a mine
    return {
      ok: true,
      changed: true,
      state: loseGame({ ...state, board, flagsPlaced, firstRevealDone: true }),
    };
  }
  //If click on safe cell
  const { board: revealedBoard, revealedCount } = revealSafeArea(board, position);

  // Win detection runs last
  return {
    ok: true,
    changed: true,
    state: withWinStatus({
      ...state,
      board: revealedBoard,
      flagsPlaced,
      revealedSafeCount: state.revealedSafeCount + revealedCount,
      firstRevealDone: true,
    }),
  };
}

/** Toggle covered/flagged cells; ignore revealed cells, finished games, or excess flags. */
export function toggleFlag(
  state: GameState,
  position: Position,
): ActionResult {
  if (!isValidPosition(position)) {
    return {
      ok: false,
      code: "INVALID_POSITION",
      message: "Cell coordinates must be integers from 0 through 9.",
    };
  }

  if (state.status !== "playing") {
    return {
      ok: true,
      changed: false,
      state,
    };
  }

  const cell = getCell(state.board, position);

  if (cell.visibility === "revealed") {
    return {
      ok: true,
      changed: false,
      state,
    };
  }

  // Unflagging remains available even when all allowed flags are placed.
  if (cell.visibility === "flagged") {
    const board: Board = state.board.map((row, rowIndex) =>
      row.map((existingCell, columnIndex) =>
        rowIndex === position.row && columnIndex === position.column
          ? { ...existingCell, visibility: "covered" as const }
          : existingCell,
      ),
    );

    return {
      ok: true,
      changed: true,
      state: {
        ...state,
        board,
        flagsPlaced: state.flagsPlaced - 1,
      },
    };
  }

  if (state.flagsPlaced >= state.mineCount) {
    return {
      ok: true,
      changed: false,
      state,
    };
  }

  const board: Board = state.board.map((row, rowIndex) =>
    row.map((existingCell, columnIndex) =>
      rowIndex === position.row && columnIndex === position.column
        ? { ...existingCell, visibility: "flagged" as const }
        : existingCell,
    ),
  );

  return {
    ok: true,
    changed: true,
    state: {
      ...state,
      board,
      flagsPlaced: state.flagsPlaced + 1,
    },
  };
}

/**
 * End-of-game transition for a loss
 */
function loseGame(state: GameState): GameState {
  return {
    ...state,
    board: exposeAllMines(state.board),
    status: "lost",
  };
}

/**
 * How many cells the player has to uncover to win: the whole board minus the mines.
 */
function countSafeCells(board: Board, mineCount: number): number {
  const cellCount = board.reduce((total, row) => total + row.length, 0);
  return cellCount - mineCount;
}

/**
 * True once every safe cell is uncovered.
 */
function hasWon(state: GameState): boolean {
  return (
    state.status === "playing" &&
    state.revealedSafeCount >= countSafeCells(state.board, state.mineCount)
  );
}

/** Applies the win transition, returning the very same state object when not yet won. */
function withWinStatus(state: GameState): GameState {
  return hasWon(state) ? { ...state, status: "won" } : state;
}

/** Outcome of a cascade: the updated board plus how many cells were newly opened. */
interface SafeAreaReveal {
  readonly board: Board;
  readonly revealedCount: number;
}

/** Open the whole safe region that the player's click belongs to using BFS walk */
function revealSafeArea(board: Board, origin: Position): SafeAreaReveal {
  if (!isValidPosition(origin)) {
    throw new RangeError("Cell coordinates must be integers from 0 through 9.");
  }

  const frontier: Position[] = [origin];
  // Track what cell has been visited to prevent duplicate visit attempts
  const visited = new Set<string>();
  let nextBoard = board;
  let revealedCount = 0;
  let frontierIndex = 0;

  while (frontierIndex < frontier.length) {
    const current = frontier[frontierIndex++]!;
    const key = `${current.row}:${current.column}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = getCell(nextBoard, current);

    // Skip flagged and already revealed cells
    if (cell.visibility !== "covered") continue;

    nextBoard = updateCell(nextBoard, current, { visibility: "revealed" });
    revealedCount++;

    // Current neighbor counts guarantee that neighbors of a zero cell are safe.
    if (cell.adjacentMines === 0) {
      frontier.push(...getNeighbors(current));
    }
  }

  return { board: nextBoard, revealedCount };
}
