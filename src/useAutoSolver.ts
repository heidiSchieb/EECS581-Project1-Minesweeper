import { useEffect, useRef, useState } from "react";
import {
  BOARD_SIZE,
  type GameState,
  type Position,
} from "./types";

// Select a covered cell without checking hidden mine locations.
function chooseRandomCell(gameState: GameState): Position | null {
  const availableCells: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const cell = gameState.board[row]?.[column];

      // "covered" excludes both flagged and revealed cells.
      if (cell?.visibility === "covered") {
        availableCells.push({ row, column });
      }
    }
  }

  if (availableCells.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * availableCells.length);
  return availableCells[index] ?? null;
}

export function useAutoSolver(
  gameState: GameState | null,
  onUncover: (position: Position) => void,
) {
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  function startAuto() {
    if (gameState?.status === "playing") {
      setIsRunning(true);
    }
  }

  function stopAuto() {
    // Cancel the next scheduled move immediately.
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsRunning(false);
  }

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // Stop after a win, loss, or return to the setup screen.
    if (!gameState || gameState.status !== "playing") {
      setIsRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      timerRef.current = null;

      const position = chooseRandomCell(gameState);

      if (position === null) {
        setIsRunning(false);
        return;
      }

      // Use the game's existing handler to perform the move.
      onUncover(position);
    }, 500);

    timerRef.current = timer;

    // Cancel the old timer when the board changes, playback stops,
    // or this component is removed.
    return () => {
      window.clearTimeout(timer);

      if (timerRef.current === timer) {
        timerRef.current = null;
      }
    };
  }, [gameState, isRunning, onUncover]);

  return { isRunning, startAuto, stopAuto };
}
