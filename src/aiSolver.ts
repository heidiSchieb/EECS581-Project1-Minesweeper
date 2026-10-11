/**
 * Module: aiSolver
 * Description: Implements one Easy, Medium, or Hard move on a shared Minesweeper state.
 * Inputs: GameState, AI difficulty, and an optional deterministic random source.
 * Outputs: Updated state and, for a loss, the detonated position.
 * Project 2 user-versus-AI attribution: Lilly Tran & Heidi Schieber.
 * Project 2 automatic-solving attribution: Zain Cheema and Ibaad Khatib.
 * External sources: Project 2 assignment rules; OpenAI Copilot assisted with implementation
 * and tests. No third-party solver code copied.
 * Updated: 2026-10-10
 */
import { getCell, getNeighbors } from "./boardManager.ts";
import { toggleFlag, uncover } from "./gameLogic.ts";
import {
  BOARD_SIZE,
  type GameState,
  type Position,
  type RandomSource,
} from "./types.ts";

export type AIDifficulty = "easy" | "medium" | "hard";
export type AIMode = "manual" | "interactive" | "automatic";

export interface AiMoveResult {
  readonly state: GameState;
  readonly detonatedPosition: Position | null;
}

interface NeighborState {
  readonly position: Position;
  readonly visibility: "covered" | "flagged" | "revealed";
}

interface RevealedClue {
  readonly position: Position;
  readonly value: number;
  readonly covered: readonly Position[];
  readonly flagged: number;
}

function positionKey({ row, column }: Position): string {
  return `${row}:${column}`;
}

/** Collect number clues and count only the still-covered and flagged neighbors. */
function getRevealedClues(state: GameState): RevealedClue[] {
  const clues: RevealedClue[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const position = { row, column };
      const cell = getCell(state.board, position);
      if (cell.visibility !== "revealed" || cell.hasMine) continue;

      const neighbors: NeighborState[] = getNeighbors(position).map((neighbor) => ({
        position: neighbor,
        visibility: getCell(state.board, neighbor).visibility,
      }));
      clues.push({
        position,
        value: cell.adjacentMines,
        covered: neighbors
          .filter((neighbor) => neighbor.visibility === "covered")
          .map((neighbor) => neighbor.position),
        flagged: neighbors.filter((neighbor) => neighbor.visibility === "flagged").length,
      });
    }
  }

  return clues;
}

/** Select uniformly from covered cells so flags and revealed cells are never chosen. */
function chooseRandomCoveredCell(
  state: GameState,
  random: RandomSource,
): Position | null {
  const covered: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      if (getCell(state.board, { row, column }).visibility === "covered") {
        covered.push({ row, column });
      }
    }
  }

  if (covered.length === 0) return null;

  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError("The random source must return a number in [0, 1).");
  }

  return covered[Math.floor(sample * covered.length)]!;
}

function applyFlagMoves(state: GameState, positions: readonly Position[]): GameState {
  let nextState = state;

  for (const position of positions) {
    if (nextState.status !== "playing") break;
    const result = toggleFlag(nextState, position);
    if (result.ok && result.changed) nextState = result.state;
  }

  return nextState;
}

function applyUncoverMoves(
  state: GameState,
  positions: readonly Position[],
  random: RandomSource,
): AiMoveResult {
  let nextState = state;

  for (const position of positions) {
    if (nextState.status !== "playing") break;
    const result = uncover(nextState, position, random);
    if (result.ok && result.changed) {
      nextState = result.state;
      if (nextState.status === "lost") {
        return { state: nextState, detonatedPosition: position };
      }
    }
  }

  return { state: nextState, detonatedPosition: null };
}

/** Apply the first deterministic Medium deduction available on a revealed clue. */
function applyMediumRule(
  state: GameState,
  clues: readonly RevealedClue[],
  random: RandomSource,
): AiMoveResult {
  for (const clue of clues) {
    if (clue.covered.length === 0) continue;

    // Flags count as known mines; only flag covered cells when all remaining
    // covered neighbors must be mines and the board's flag limit permits it.
    if (
      clue.flagged + clue.covered.length === clue.value &&
      state.flagsPlaced < state.mineCount
    ) {
      const flaggedState = applyFlagMoves(state, clue.covered);
      if (flaggedState !== state) {
        return { state: flaggedState, detonatedPosition: null };
      }
    }

    if (clue.flagged === clue.value) {
      const revealResult = applyUncoverMoves(state, clue.covered, random);
      if (revealResult.state !== state) return revealResult;
    }
  }

  return { state, detonatedPosition: null };
}

function expectedCoveredNeighbors(
  clue: RevealedClue,
  expected: readonly Position[],
): boolean {
  if (clue.flagged !== 0 || clue.covered.length !== expected.length) return false;

  const expectedKeys = new Set(expected.map(positionKey));
  return clue.covered.every((position) => expectedKeys.has(positionKey(position)));
}

function patternIsValid(
  clues: readonly RevealedClue[],
  expectedForClue: readonly (readonly Position[])[],
): boolean {
  return clues.every((clue, index) =>
    expectedCoveredNeighbors(clue, expectedForClue[index]!),
  );
}

/** Find the required 1-2-1 line with the exact hidden-neighbor geometry. */
function findOneTwoOneTargets(state: GameState): readonly Position[] | null {
  const clueByPosition = new Map(
    getRevealedClues(state).map((clue) => [positionKey(clue.position), clue]),
  );

  function checkPattern(
    cluePositions: readonly Position[],
    targets: readonly Position[],
    expectedForClue: readonly (readonly Position[])[],
  ): readonly Position[] | null {
    const clues = cluePositions.map((position) => clueByPosition.get(positionKey(position)));
    const firstClue = clues[0];
    const middleClue = clues[1];
    const lastClue = clues[2];
    if (
      !firstClue ||
      !middleClue ||
      !lastClue ||
      firstClue.value !== 1 ||
      middleClue.value !== 2 ||
      lastClue.value !== 1 ||
      !patternIsValid([firstClue, middleClue, lastClue], expectedForClue) ||
      targets.some((target) => getCell(state.board, target).visibility !== "covered")
    ) {
      return null;
    }

    return targets;
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE - 2; column++) {
      const cluePositions = [0, 1, 2].map((offset) => ({ row, column: column + offset }));

      for (const targetRow of [row - 1, row + 1]) {
        if (targetRow < 0 || targetRow >= BOARD_SIZE) continue;

        const targets = [0, 1, 2].map((offset) => ({ row: targetRow, column: column + offset }));
        const result = checkPattern(cluePositions, targets, [
          [targets[0]!, targets[1]!],
          targets,
          [targets[1]!, targets[2]!],
        ]);
        if (result) return result;
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE - 2; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const cluePositions = [0, 1, 2].map((offset) => ({ row: row + offset, column }));

      for (const targetColumn of [column - 1, column + 1]) {
        if (targetColumn < 0 || targetColumn >= BOARD_SIZE) continue;

        const targets = [0, 1, 2].map((offset) => ({ row: row + offset, column: targetColumn }));
        const result = checkPattern(cluePositions, targets, [
          [targets[0]!, targets[1]!],
          targets,
          [targets[1]!, targets[2]!],
        ]);
        if (result) return result;
      }
    }
  }

  return null;
}

function applyHardPattern(state: GameState, random: RandomSource): AiMoveResult {
  const targets = findOneTwoOneTargets(state);
  if (!targets) return { state, detonatedPosition: null };

  const flaggedState = applyFlagMoves(state, [targets[0]!, targets[2]!]);
  return applyUncoverMoves(flaggedState, [targets[1]!], random);
}

/**
 * Make one AI turn, applying a full deterministic rule before random fallback.
 * Hard mode checks the 1-2-1 pattern before applying the Medium rules.
 */
export function makeAiTurn(
  state: GameState,
  difficulty: AIDifficulty,
  random: RandomSource = Math.random,
): AiMoveResult {
  if (state.status !== "playing") {
    return { state, detonatedPosition: null };
  }

  if (difficulty === "hard") {
    const patternResult = applyHardPattern(state, random);
    if (patternResult.state !== state) return patternResult;
  }

  if (difficulty !== "easy") {
    const ruleResult = applyMediumRule(state, getRevealedClues(state), random);
    if (ruleResult.state !== state) return ruleResult;
  }

  const position = chooseRandomCoveredCell(state, random);
  if (!position) return { state, detonatedPosition: null };

  const result = uncover(state, position, random);
  if (!result.ok || !result.changed) {
    return { state, detonatedPosition: null };
  }

  return {
    state: result.state,
    detonatedPosition: result.state.status === "lost" ? position : null,
  };
}

/** Compatibility helper for callers that need only the resulting game state. */
export function makeAiMove(
  state: GameState,
  difficulty: AIDifficulty,
  random: RandomSource = Math.random,
): GameState {
  return makeAiTurn(state, difficulty, random).state;
}
