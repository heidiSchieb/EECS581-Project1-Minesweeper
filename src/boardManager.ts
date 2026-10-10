/**
 * Module: boardManager: immutable grid access, mine placement, and neighbor counts
 * Inputs: Board, Position, cell changes, mine count, optional RandomSource
 * Outputs: Board, Cell, Position[], or boolean; invalid arguments throw RangeError
 * Authors: Anh Hoang (board operations, consolidation); Montaha Jornaz (counts/first-click safety); Rijul Poudel (random relocation/mine exposure)
 * Created: 2026-09-10 
 * External Source: OpenAI ChatGPT assisted with code testing and comments
 */
import {
  BOARD_SIZE, MIN_MINES, MAX_MINES,
  type AdjacentMines, type Board, type Cell, type Position, type RandomSource,
} from "./types.ts";

export function createBoard(): Board { //Initiate 100 cells with no mine and are covered
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => ({
      hasMine: false,
      visibility: "covered",
      adjacentMines: 0,
    })),
  );
}

export function isValidPosition({ row, column }: Position): boolean { //Helper to validate input position
  return Number.isInteger(row) && Number.isInteger(column)
    && row >= 0 && row < BOARD_SIZE
    && column >= 0 && column < BOARD_SIZE;
}

export function getCell(board: Board, position: Position): Cell { //helper to choose a cell
  if (!isValidPosition(position)) {
    throw new RangeError("Cell coordinates must be integers from 0 through 9.");
  }
  const cell = board[position.row]?.[position.column];
  if (cell === undefined) {
    throw new RangeError("The board has no cell at the requested position.");
  }
  return cell;
}

export function updateCell(board: Board, position: Position, changes: Partial<Cell>): Board { //Function to update the cell
  const cell = getCell(board, position);
  return board.map((row, rowIndex) =>
    rowIndex === position.row
      ? row.map((existingCell, columnIndex) =>
          columnIndex === position.column ? { ...cell, ...changes } : existingCell,
        )
      : row,
  );
}

export function getNeighbors(position: Position): Position[] {//Function to get access to all the neighbors
  if (!isValidPosition(position)) {
    throw new RangeError("Cell coordinates must be integers from 0 through 9.");
  }
  const neighbors: Position[] = [];
  for (let row = position.row - 1; row <= position.row + 1; row++) {
    for (let column = position.column - 1; column <= position.column + 1; column++) {
      if (row === position.row && column === position.column) continue;
      const neighbor = { row, column };
      if (isValidPosition(neighbor)) neighbors.push(neighbor);
    }
  }
  return neighbors;
}

/** Create a covered board with distinct mines and counts for all eight neighbors. */
export function createBoardWithMines(
  mineCount: number,
  random: RandomSource = Math.random,
): Board {
  //1. Validate mine count
  if (!Number.isInteger(mineCount) || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    throw new RangeError(`Mine count must be an integer from ${MIN_MINES} through ${MAX_MINES}.`);
  }
  //2. Choose position to put mines
  const available = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index);
  const mines = new Set<number>();
  for (let placed = 0; placed < mineCount; placed++) { // Sample from remaining positions to avoid duplicate mines.
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError("The random source must return a number in [0, 1).");
    }
    const index = Math.floor(sample * available.length);
    const selected = available.splice(index, 1)[0]!;
    mines.add(selected);
  }
  //3. Initate the board
  const board = createBoard().map((row, rowIndex) =>
    row.map((cell, columnIndex) => ({
      ...cell,
      hasMine: mines.has(rowIndex * BOARD_SIZE + columnIndex), //compute the number of the cell and check if there is mine or not (mine.has() return True/False)
    })),
  );

  return calculateAdjacentMines(board);
}

export function calculateAdjacentMines(board: Board): Board {
  return board.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      const position = { row: rowIndex, column: columnIndex };

      const adjacentMines = getNeighbors(position)
        .filter((neighbor) => getCell(board, neighbor).hasMine)
        .length as AdjacentMines;

      return {
        ...cell,
        adjacentMines,
      };
    }),
  );
}

/**
 * Clear the first cell's surrounding area so its initial reveal opens a zero-region.
 * Relocated mines are placed outside the area without changing the total mine count.
 */
export function makeFirstRevealAreaSafe(
  board: Board,
  position: Position,
  random: RandomSource = Math.random,
): Board {
  const safeArea = [position, ...getNeighbors(position)];
  const safeAreaKeys = new Set(
    safeArea.map(({ row, column }) => `${row}:${column}`),
  );
  const minesToRelocate = safeArea.filter((areaPosition) =>
    getCell(board, areaPosition).hasMine,
  );

  if (minesToRelocate.length === 0) {
    return board;
  }

  const candidates: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const candidate = getCell(board, { row, column });

      if (
        !safeAreaKeys.has(`${row}:${column}`) &&
        !candidate.hasMine &&
        candidate.visibility === "covered"
      ) {
        candidates.push({ row, column });
      }
    }
  }

  if (candidates.length < minesToRelocate.length) {
    throw new RangeError("Not enough covered cells outside the first reveal area to relocate mines.");
  }

  const relocatedPositions = new Set<string>();
  for (const _mine of minesToRelocate) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError("The random source must return a number in [0, 1).");
    }

    const index = Math.floor(sample * candidates.length);
    const [destination] = candidates.splice(index, 1);
    if (!destination) {
      throw new RangeError("Unable to find a cell for a relocated mine.");
    }
    relocatedPositions.add(`${destination.row}:${destination.column}`);
  }

  const updatedBoard = board.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      const key = `${rowIndex}:${columnIndex}`;
      if (safeAreaKeys.has(key)) return { ...cell, hasMine: false };
      return relocatedPositions.has(key) ? { ...cell, hasMine: true } : cell;
    }),
  );

  return calculateAdjacentMines(updatedBoard);
}

/**
 * Reveal every mine, including flagged mines; leave safe cells unchanged.
 */
export function exposeAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((cell) =>
      cell.hasMine && cell.visibility !== "revealed"
        ? { ...cell, visibility: "revealed" as const }
        : cell,
    ),
  );
}
