import {
    createBoardWithMines, exposeAllMines, getCell, getNeighbors,
    isValidPosition, makeFirstCellSafe, updateCell,
  } from "./boardManager.ts";
import {
    MIN_MINES, MAX_MINES, BOARD_SIZE,
    type Board, type GameState, type Position, type Cell,
  } from "./types.ts";
import {
    startGame, toggleFlag, uncover
} from "./gameLogic.ts";

function aiSolverEasy(gameState : GameState) {
    if (gameState.status !== "playing"){
        return gameState;
    }

    while(true){
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        const cell = gameState.board[row]?.[col];

        if (cell?.visibility === "covered") {
            const result = uncover(gameState, { row, column: col });
            return result.ok ? result.state : gameState;
        }
    }
}

function aiSolverMedium(gameState : GameState) {
    if (gameState.status !== "playing") {
        return gameState;
    }

    // check if neighbors can be flagged or safely uncovered
    for (let row = 0; row < BOARD_SIZE; row++){
        for (let col = 0; col < BOARD_SIZE; col++){
            const cell = gameState.board[row]![col]!;

            const coveredCellsPosition: Array<Position> = [];
            const flaggedCellsPosition: Array<Position> = [];

            if (cell.visibility === "revealed" && !cell.hasMine){
                for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                    for (let colOffset = -1; colOffset <= 1; colOffset++) {
                        // skips the check covered cell at (row, col)
                        if (rowOffset === 0 && colOffset === 0) {
                            continue;
                        }

                        const neighborRow = row + rowOffset;
                        const neighborCol = col + colOffset;

                        // bounds check: skip out of range coordinates
                        if (neighborRow < 0 || neighborRow >= BOARD_SIZE || 
                            neighborCol < 0 || neighborCol >= BOARD_SIZE) {
                            continue;
                        }

                        const neighborCell = gameState.board[neighborRow]![neighborCol]!;

                        if (neighborCell.visibility === "covered"){
                            const pos: Position = {row: neighborRow, column: neighborCol};
                            coveredCellsPosition.push(pos);
                        }
                        else if (neighborCell.visibility === "flagged"){
                            const pos: Position = {row: neighborRow, column: neighborCol};
                            flaggedCellsPosition.push(pos);
                        }
                    }
                }
            
                if (coveredCellsPosition.length > 0 && cell.adjacentMines === coveredCellsPosition.length + flaggedCellsPosition.length) {
                    for (let posIdx = 0; posIdx < coveredCellsPosition.length; posIdx++){
                        const result = toggleFlag(gameState, coveredCellsPosition[posIdx]!);

                        if (result.ok && result.changed){
                            gameState = result.state;
                        }
                    }

                    return gameState;
                }
                else if (coveredCellsPosition.length > 0 && flaggedCellsPosition.length === cell.adjacentMines) {
                    for (let posIdx = 0; posIdx < coveredCellsPosition.length; posIdx++) {
                        const result = uncover(gameState, coveredCellsPosition[posIdx]!);
                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }
                    }
                    return gameState;
                }
            }
        }
    }

    while(true){
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        const cell = gameState.board[row]?.[col];

        if (cell?.visibility === "covered") {
            const result = uncover(gameState, { row, column: col });

            if (result.ok && result.changed){
                return result.state;
            }
        }
    }
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