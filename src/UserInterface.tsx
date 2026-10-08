/**
 * Module: UserInterface: owns React game state and renders the game screen
 * Inputs: Player events and ActionResult values from inputHandler
 * Outputs: Rendered screen; start, uncover, and flag requests
 * Authors: Anh Hoang (setup); Sreeja Narahari (setup/phases); Mariska Rai (arcade UI, command wiring, loading fix)
 * Created: 2026-09-10 
 */
import { useMemo, useState } from "react";
import { createBoard } from "./boardManager";
import GameBoard from "./components/GameBoard";
import SetupControls from "./components/SetupControls";
import { processFlagInput, processSetupInput, processUncoverInput } from "./inputHandler";
import { BOARD_SIZE, type GameState, type Position } from "./types";

// Explosion sound effect; built once here so it is not recreated on every render.
const boomSound = new Audio("/vineBoom.mp3");

const PHASES = ["setup", "playing", "won", "lost"] as const;

type Phase = (typeof PHASES)[number];

// Turn the game object into a screen name. No game yet = setup.
function phaseFromGame(game: GameState | null): Phase {
  if (!game) return "setup";
  return game.status;
}

function phaseLabel(phase: Phase): string {
  if (phase === "won") return "Victory";
  if (phase === "lost") return "Loss";
  if (phase === "playing") return "Playing";
  return "Setup";
}

function statusCopy(phase: Phase): string {
  if (phase === "lost") return "Game Over: Loss";
  if (phase === "won") return "Victory";
  if (phase === "playing") return "Playing";
  return "Choose a mine count, then start the round.";
}

export default function UserInterface() {
  // --- React state the screen needs ---
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [detonated, setDetonated] = useState<Position | null>(null);
  const previewBoard = useMemo(() => createBoard(), []);

  const phase = phaseFromGame(gameState);
  const board = gameState?.board ?? previewBoard;
  const minesLeft = gameState ? gameState.mineCount - gameState.flagsPlaced : 0;

  // --- Talk to game logic through the input handler ---
  function returnToSetup() {
    setGameState(null);
    setDetonated(null);
    setError("");
  }

  function handleStart(rawInput: string) {
    const result = processSetupInput(rawInput);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setDetonated(null);
    setGameState(result.state);
    setError("");
  }

  function handleUncover(position: Position) {
    if (!gameState) return;

    const result = processUncoverInput(gameState, { kind: "click", position });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (!result.changed) return;

    setError("");
    setGameState(result.state);
    if (result.state.status === "lost") {
      setDetonated(position);
      boomSound.currentTime = 0;
      boomSound.play().catch(() => {});
    }
  }

  function handleFlag(position: Position) {
    if (!gameState) return;

    const result = processFlagInput(gameState, { kind: "click", position });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (!result.changed) return;

    setError("");
    setGameState(result.state);
  }

  return (
    <main className="page">
      <section className={`shell ${phase === "lost" ? " is-shaking" : ""}`}>
        {/* Title, how to play, and which phase we are in */}
        <header className="shell-header">
          <div className="title-block">
            <p className="eyebrow">EECS 581 / PIXEL ARCADE</p>
            <h1>Minesweeper</h1>
            <p className="instruction">
              Pick 10–20 mines on a fixed {BOARD_SIZE}×{BOARD_SIZE} board. Left click uncovers; right
              click flags.
            </p>
          </div>

          <nav className="view-tabs" aria-label="Game phase">
            {PHASES.map((item) => (
              <span key={item} className="phase" aria-current={phase === item ? "true" : undefined}>
                {phaseLabel(item)}
              </span>
            ))}
          </nav>

          <aside className="board-badge" aria-label="Board size">
            <span>Fixed</span>
            <strong>
              {BOARD_SIZE}×{BOARD_SIZE}
            </strong>
            <span>board</span>
          </aside>
        </header>

        {/* Setup: pick mine count and start a game */}
        {phase === "setup" ? (
          <div className="setup-panel">
            <SetupControls onStart={handleStart} />
          </div>
        ) : null}

        {/* Playing: live counts and a way to restart */}
        {phase === "playing" ? (
          <div className="hud" aria-live="polite">
            <div className="hud-item">
              <span className="hud-label">Mines left</span>
              <span className="hud-value">{minesLeft}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Status</span>
              <span className="hud-value hud-value--text">{statusCopy(phase)}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Mine total</span>
              <span className="hud-value">{gameState?.mineCount}</span>
            </div>
            <button type="button" className="new-game" onClick={returnToSetup}>
              New Game
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="setup-error" role="alert">
            {error}
          </p>
        ) : null}

        {/* Win or loss: freeze the board and offer a new round */}
        {phase === "won" || phase === "lost" ? (
          <div className={`end-banner${phase === "lost" ? " end-banner--loss" : ""}`}>
            <p className="end-title">{statusCopy(phase)}</p>
            <button type="button" className="start-round" onClick={returnToSetup}>
              Start round
            </button>
          </div>
        ) : null}

        {/* Grid: preview when idle, playable only while the game is running */}
        <section className="stage" aria-label="Minesweeper board">
          <p className="stage-label">STAGE 01</p>
          <div className={`board-wrap${phase === "setup" ? " is-preview" : ""}`}>
            <GameBoard
              board={board}
              disabled={phase !== "playing"}
              detonated={detonated}
              onUncover={handleUncover}
              onFlag={handleFlag}
            />
            {phase === "lost" && (
                <div className="explosion-overlay" aria-hidden="true" />
            )}
          </div>
        </section>

        
      </section>
    </main>
  );
}
