/**
 * Module: GameBoard - renders the interactive minesweeper grid and its UI state.
 * Description: Displays the board, handles click and keyboard interactions, and emits uncover/flag callbacks.
 * Inputs: current board state, disabled/detonated state, onUncover callback, onFlag callback.
 * Outputs: rendered grid cells and callback calls for uncover and flag actions.
 * External sources/attribution: OpenAI Copilot assisted with documentation updates; no third-party code copied.
 * Authors: Alica Mungamuri & Audrey Facer.
 * Created: 2026-10-10
 */
import type { KeyboardEvent, MouseEvent } from "react";
import { BOARD_SIZE, type Board, type Cell, type Position } from "../types";

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
const ROWS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

type GameBoardProps = {
  board: Board;
  disabled?: boolean;
  detonated?: Position | null;
  onUncover: (position: Position) => void;
  onFlag: (position: Position) => void;
};

// How a cell should look and what the screen reader should say.
function isSamePosition(a: Position | null | undefined, b: Position): boolean {
  return a != null && a.row === b.row && a.column === b.column;
}

function cellClassName(cell: Cell, detonated: boolean): string {
  if (cell.visibility === "flagged") return "cell flagged";
  if (cell.visibility === "covered") return "cell covered";
  if (cell.hasMine) return detonated ? "cell revealed detonated" : "cell revealed mine";
  if (cell.adjacentMines === 0) return "cell revealed";
  return `cell revealed n${cell.adjacentMines}`;
}

function cellAriaLabel(cell: Cell, column: string, row: string, detonated: boolean): string {
  if (cell.visibility === "flagged") return `${column}${row} flagged`;
  if (cell.visibility === "covered") return `${column}${row} covered`;
  if (cell.hasMine) return detonated ? `${column}${row} detonated mine` : `${column}${row} revealed mine`;
  if (cell.adjacentMines === 0) return `${column}${row} revealed empty`;
  return `${column}${row} revealed ${cell.adjacentMines}`;
}

// Tiny pixel flag and mine pictures used inside cells.
function PixelFlag() {
  return (
    <svg className="pixel-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="1" width="2" height="14" fill="#0f172a" />
      <rect x="5" y="2" width="8" height="6" fill="#910e2b" />
      <rect x="5" y="2" width="8" height="2" fill="#c81e3a" />
    </svg>
  );
}

function PixelMine() {
  return (
    <svg className="pixel-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="6" y="2" width="4" height="12" fill="#0f172a" />
      <rect x="2" y="6" width="12" height="4" fill="#0f172a" />
      <rect x="4" y="4" width="8" height="8" fill="#0f172a" />
      <rect x="5" y="5" width="2" height="2" fill="#f6f8fb" />
    </svg>
  );
}

function CellContent({ cell }: { cell: Cell }) {
  if (cell.visibility === "flagged") return <PixelFlag />;
  if (cell.visibility === "covered") return null;
  if (cell.hasMine) return <PixelMine />;
  if (cell.adjacentMines === 0) return null;
  return cell.adjacentMines;
}

export default function GameBoard({
  board,
  disabled = false,
  detonated = null,
  onUncover,
  onFlag,
}: GameBoardProps) {
  // Left click uncovers. Right click, Ctrl/Shift-click, or F flags.
  function handleClick(event: MouseEvent<HTMLButtonElement>, position: Position) {
    if (disabled) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      onFlag(position);
      return;
    }
    onUncover(position);
  }

  function handleContextMenu(event: MouseEvent<HTMLButtonElement>, position: Position) {
    event.preventDefault();
    if (disabled) return;
    onFlag(position);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, position: Position) {
    if (disabled) return;
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      onFlag(position);
    }
  }

  // Corner + column letters, then each row number and its 10 cells.
  return (
    <div className="board" role="grid" aria-rowcount={BOARD_SIZE} aria-colcount={BOARD_SIZE}>
      <div className="corner" aria-hidden="true" />
      {COLUMNS.map((column, columnIndex) => (
        <div key={column} className="axis" title={`${column} = ${columnIndex}`}>
          {column}
        </div>
      ))}
      {board.flatMap((row, rowIndex) => {
        const rowLabel = ROWS[rowIndex] ?? String(rowIndex + 1);
        return [
          <div key={`row-${rowLabel}`} className="axis" title={`row ${rowLabel} = ${rowIndex}`}>
            {rowLabel}
          </div>,
          ...row.map((cell, columnIndex) => {
            const column = COLUMNS[columnIndex] ?? String(columnIndex);
            const position = { row: rowIndex, column: columnIndex };
            const exploded = isSamePosition(detonated, position);
            return (
              <button
                key={`${column}${rowLabel}`}
                type="button"
                role="gridcell"
                className={cellClassName(cell, exploded)}
                aria-label={cellAriaLabel(cell, column, rowLabel, exploded)}
                tabIndex={disabled ? -1 : 0}
                onClick={(event) => handleClick(event, position)}
                onContextMenu={(event) => handleContextMenu(event, position)}
                onKeyDown={(event) => handleKeyDown(event, position)}
              >
                <CellContent cell={cell} />
              </button>
            );
          }),
        ];
      })}
    </div>
  );
}
