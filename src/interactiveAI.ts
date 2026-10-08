import {
    createBoard,calculateAdjacentMines,createBoardWithMines, exposeAllMines, getCell, getNeighbors,
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

function aiSolverMedium(gameState : GameState, useFallback = true) {
    if (gameState.status !== "playing") {
        return gameState;
    }

    // check if neighbors can be flagged or safely uncovered
    for (let row = 0; row < BOARD_SIZE; row++){
        for (let col = 0; col < BOARD_SIZE; col++){
            const cell = gameState.board[row]![col]!;
            if (cell.visibility !== "revealed") {
                continue;
            }
            const pos: Position = {row: row, column: col};

            // get neighbors' positions
            const neighborsPositions = getNeighbors(pos);

            // map the neighbors' positions back to the corresponding cell
            const neighbors = neighborsPositions.map(p => ({
                pos: p,
                cell: gameState.board[p.row]![p.column]!
            }));

            // filter for covered and flagged neighbor cells
            const covered = neighbors.filter(n => n.cell.visibility === "covered");
            const flagged = neighbors.filter(n => n.cell.visibility === "flagged");

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
    if (useFallback) {
        return aiSolverEasy(gameState);
    }
    // for the hard ai solver 
    return gameState;
     
}

function aiSolverHard(gameState: GameState) {
    if (gameState.status !== "playing") {
        return gameState;
    }

    //first chek the medium rules 
    const mediumState = aiSolverMedium(gameState, false);

    // updates the game state if medium mode made a move 
    if (mediumState !== gameState) {
        return mediumState;
    }

    //first checks the 1-2-1 horizontally
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {

            const left = gameState.board[row]![col]!;
            const middle = gameState.board[row]![col + 1]!;
            const right = gameState.board[row]![col + 2]!;

            // Check for revealed 1-2-1
            if (
                left.visibility === "revealed" &&
                middle.visibility === "revealed" &&
                right.visibility === "revealed" &&
                left.adjacentMines === 1 &&
                middle.adjacentMines === 2 &&
                right.adjacentMines === 1
            ) {
                
                //reveals the hidden cells below
                if (row + 1 < BOARD_SIZE) {

                    const outerLeft = gameState.board[row + 1]![col]!;
                    const inner = gameState.board[row + 1]![col + 1]!;
                    const outerRight = gameState.board[row + 1]![col + 2]!;

                    if (
                        outerLeft.visibility === "covered" &&
                        inner.visibility === "covered" &&
                        outerRight.visibility === "covered"
                    ) {

                        // Left cell is a mine
                        let result = toggleFlag(gameState, {
                            row: row + 1,
                            column: col
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Right cell is a mine
                        result = toggleFlag(gameState, {
                            row: row + 1,
                            column: col + 2
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Middle cell is safe
                        result = uncover(gameState, {
                            row: row + 1,
                            column: col + 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        return gameState;
                    }
                }

                //reveals the cells above 
                if (row - 1 >= 0) {

                    const outerLeft = gameState.board[row - 1]![col]!;
                    const inner = gameState.board[row - 1]![col + 1]!;
                    const outerRight = gameState.board[row - 1]![col + 2]!;

                    if (
                        outerLeft.visibility === "covered" &&
                        inner.visibility === "covered" &&
                        outerRight.visibility === "covered"
                    ) {

                        // Left  cell is a mine
                        let result = toggleFlag(gameState, {
                            row: row - 1,
                            column: col
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Right cell is a mine
                        result = toggleFlag(gameState, {
                            row: row - 1,
                            column: col + 2
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Middle cell is safe
                        result = uncover(gameState, {
                            row: row - 1,
                            column: col + 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        return gameState;
                    }
                }
            }
        }
    }
    //checcks vertivall for the 1-2-1
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {

            const top = gameState.board[row]![col]!;
            const middle = gameState.board[row + 1]![col]!;
            const bottom = gameState.board[row + 2]![col]!;

            // Check for revealed 1-2-1
            if (
                top.visibility === "revealed" &&
                middle.visibility === "revealed" &&
                bottom.visibility === "revealed" &&
                top.adjacentMines === 1 &&
                middle.adjacentMines === 2 &&
                bottom.adjacentMines === 1
            ) {
                

                //reveals the hidden cells onto the right
                if (col + 1 < BOARD_SIZE) {

                    const outerTop = gameState.board[row]![col + 1]!;
                    const inner = gameState.board[row + 1]![col + 1]!;
                    const outerBottom = gameState.board[row + 2]![col + 1]!;

                    if (
                        outerTop.visibility === "covered" &&
                        inner.visibility === "covered" &&
                        outerBottom.visibility === "covered"
                    ) {

                        // Top cell is a mine
                        let result = toggleFlag(gameState, {
                            row: row,
                            column: col + 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Bottom cell is a mine
                        result = toggleFlag(gameState, {
                            row: row + 2,
                            column: col + 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Middle cell is safe
                        result = uncover(gameState, {
                            row: row + 1,
                            column: col + 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        return gameState;
                    }
                }
                // checks the hidden cells on the left
                if (col - 1 >= 0) {

                    const outerTop = gameState.board[row]![col - 1]!;
                    const inner = gameState.board[row + 1]![col - 1]!;
                    const outerBottom = gameState.board[row + 2]![col - 1]!;

                    if (
                        outerTop.visibility === "covered" &&
                        inner.visibility === "covered" &&
                        outerBottom.visibility === "covered"
                    ) {

                        // Top cell is a mine
                        let result = toggleFlag(gameState, {
                            row: row,
                            column: col - 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Bottom cell is a mine
                        result = toggleFlag(gameState, {
                            row: row + 2,
                            column: col - 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        // Middle cell is safe
                        result = uncover(gameState, {
                            row: row + 1,
                            column: col - 1
                        });

                        if (result.ok && result.changed) {
                            gameState = result.state;
                        }

                        return gameState;
                    }
                }
            }
        }
    }

    // checks a random cell if all other rules dont apply
    return aiSolverEasy(gameState);
}

//TODO: remove later (solely here for testing purposes)
function create121TestState(): GameState {
    let board = createBoard();

    // Put mines at (4, 3) and (4, 5)
    // These create the 1-2-1 pattern above them.
    board = updateCell(board, { row: 3, column: 4 }, { hasMine: true });
    board = updateCell(board, { row: 5, column: 4 }, { hasMine: true });

    // Add 8 more mines far away from the pattern.
    const extraMines = [
        { row: 8, column: 0 },
        { row: 8, column: 2 },
        { row: 8, column: 4 },
        { row: 8, column: 6 },
        { row: 8, column: 8 },
        { row: 9, column: 1 },
        { row: 9, column: 5 },
        { row: 9, column: 9 },
    ];

    for (const pos of extraMines) {
        board = updateCell(board, pos, { hasMine: true });
    }

    // Recalculate all adjacent mine numbers.
    board = calculateAdjacentMines(board);

    // Reveal the 1-2-1 cells.
    board = updateCell(
        board,
        { row: 3, column: 3 },
        { visibility: "revealed" }
    );

    board = updateCell(
        board,
        { row: 4, column: 3 },
        { visibility: "revealed" }
    );

    board = updateCell(
        board,
        { row: 5, column: 3 },
        { visibility: "revealed" }
    );

    return {
        board,
        mineCount: 10,
        flagsPlaced: 0,
        revealedSafeCount: 3,
        firstRevealDone: true,
        status: "playing",
    };
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
/*
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
  
    // 2. Test 100 AI turns
    for (let turn = 1; turn <= 100; turn++) {
      if (gameState.status !== "playing") {
        console.log(`Game ended with status: ${gameState.status}`);
        break;
      }
  
      console.log(`--- Turn ${turn} ---`);
      gameState = aiSolverHard(gameState);
      printBoard(gameState.board);
    }
  }
  */
//TODO: remove later (solely here for testing purposes)

 function main() {
    let gameState = create121TestState();

    console.log("BEFORE HARD AI:");
    printBoard(gameState.board);

    console.log("--- Running Hard AI ---");

    gameState = aiSolverHard(gameState);

    console.log("AFTER HARD AI:");
    printBoard(gameState.board);
}

main();
