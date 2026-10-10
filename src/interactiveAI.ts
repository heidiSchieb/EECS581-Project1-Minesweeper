/**
 * Module Name: interactiveAI.ts
 * Description: Implements the AI decision making algorithms (Easy, Medium, and Hard)
 * to calculate and execute automated computer moves
 * 
 * Inputs: GameState object representing the active game board and session status.
 * Outputs: Updated GameState object that reflects the game state after the AI's move.
 * 
 * Author(s): Heidi Schieber and Lilly Tran
 * Creation Date: September 30, 2026
 * 
 * External Sources / Attribution: Developed as an extension to the baseline Minesweeper codebase
 * inherited from Project Team 19. Original project logic was developed for this assignment 
 * and no third-party code was copied. The code integrates with Project Team 19's
 * existing architecture and specifications. 
 * 
 */

import {
    getNeighbors
  } from "./boardManager.ts";
import {
    BOARD_SIZE, type Board, type GameState, type Position
  } from "./types.ts";
import {
    startGame, toggleFlag, uncover
} from "./gameLogic.ts";

/**
 * Performs a basic AI move by randomly choosing coordinates until an
 * unrevealed and unflagged cell has been found and then uncovers it
 * 
 * @param gameState - Current state of the Minesweeper game
 * @returns The updated GameState after reavealing a cell or the
 *          GameState as is if the game is already finished
 */
function aiSolverEasy(gameState : GameState) {
    // only make moves if the game is still being played
    if (gameState.status !== "playing"){
        return gameState;
    }

    // continuously pick a random cell until an unrevealed cell has been selected
    while(true){
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        const cell = gameState.board[row]?.[col];

        // if the cell is covered, uncover it and return the updated gameState
        if (cell?.visibility === "covered") {
            const result = uncover(gameState, { row, column: col });
            return result.ok ? result.state : gameState;
        }
    }
}

/**
 * Performs an intermediate AI move that either 
 * 1. Flags a cell's hidden neighbors if they equal the number of remaining mines 
 * 2. Uncovers a cell's hidden neighbors if all adjacent mines have been flagged
 * 3. Falls back to calling aiSolverEasy() if no deterministic move can be made
 * 
 * @param gameState - Current state of the Minesweeper game
 * @returns The updated GameState after applying the medium level deductions
 *          or the GameState as is if the game is already finished
 */
function aiSolverMedium(gameState : GameState) {
    // only make moves if the game is still being played
    if (gameState.status !== "playing") {
        return gameState;
    }

    // iterate over every cell in the board to see if neighbors can be revealed
    for (let row = 0; row < BOARD_SIZE; row++){
        for (let col = 0; col < BOARD_SIZE; col++){
            const cell = gameState.board[row]![col]!;
            const pos: Position = {row: row, column: col};

            // retrieve all neighbor coordinate positions
            const neighborsPositions = getNeighbors(pos);

            // map the neighborsPositions back to the corresponding cell
            const neighbors = neighborsPositions.map(p => ({
                pos: p,
                cell: gameState.board[p.row]![p.column]!
            }));

            // filter for covered and flagged neighbor cells
            const covered = neighbors.filter(n => n.cell.visibility === "covered");
            const flagged = neighbors.filter(n => n.cell.visibility === "flagged");
            
            // if the cell has no hidden neigbors continue to the next iteration
            if (covered.length === 0){
                continue;
            }

            // Scenario 1: all neighbor covered cells are mines so flag them
            if (cell.adjacentMines === covered.length + flagged.length){
                for (const { pos } of covered){
                    const result = toggleFlag(gameState, pos);
                    if (result.ok && result.changed){
                        gameState = result.state;
                    }
                }
                return gameState;
            }

            // Scenario 2: all mines are flagged so safe to uncover remaining covered neighbor cells
            if (flagged.length === cell.adjacentMines) {
                for (const { pos } of covered) {
                    const result = uncover(gameState, pos);
                    if (result.ok && result.changed) {
                        gameState = result.state;
                    }
                }
                return gameState;
            }
        }
    }

    // call aiSolverEasy as a fallback
    return aiSolverEasy(gameState);
}

// TODO: remove later (solely here for testing purposes)
export function printBoard(board: Board): void {
    const rowStrings = board.map((row) =>
        row
            .map((cell) => {
                if (cell.visibility === "covered") return " . ";
                if (cell.visibility === "flagged") return " F ";
                if (cell.hasMine) return " * ";
                return ` ${cell.adjacentMines} `;
            })
            .join("|")
    );

    const divider = "---" + "+---".repeat(board.length - 1);
    
    console.log("\n" + rowStrings.join(`\n${divider}\n`) + "\n");
}

// TODO: remove later (solely here for testing purposes)
function main() {
    // 1. Initialize a valid 10x10 board with 10 mines using startGame
    const startResult = startGame(10);
  
    if (!startResult.ok) {
      console.error("Failed to start game:", startResult.message);
      return;
    }
  
    // Retrieve the generated GameState containing pre-placed mines
    let gameState: GameState = startResult.state;
  
    console.log("Initial Board (All cells covered, mines hidden):");
    printBoard(gameState.board);
  
    // 2. Test 20 AI turns
    for (let turn = 1; turn <= 20; turn++) {
      if (gameState.status !== "playing") {
        console.log(`Game ended with status: ${gameState.status}`);
        break;
      }
  
      console.log(`--- Turn ${turn} ---`);
      gameState = aiSolverMedium(gameState);
      printBoard(gameState.board);
    }
  }
  
  main();