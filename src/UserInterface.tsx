/**
 * Module: UserInterface: owns React game state, play modes, and loss feedback.
 * Inputs: Setup choices, player events, and results from game logic and the AI solver.
 * Outputs: Rendered game screens, alternating/automatic AI turns, and loss effects.
 * Authors: Anh Hoang (setup); Sreeja Narahari (setup/phases); Mariska Rai (arcade UI, command wiring, loading fix)
 * Project 2 UI attribution: Alica Mungamuri & Audrey Facer.
 * Project 2 player-versus-AI attribution: Lilly Tran & Heidi Schieber.
 * Project 2 automatic-solving attribution: Zain Cheema and Ibaad Khatib.
 * External sources: Inherited project modules and public/vineBoom.mp3, public/boom.png.
 * OpenAI Copilot assisted with Project 2 integration and review; no third-party code copied.
 * Updated: 2026-10-10
 */
import { useEffect, useMemo, useState } from "react";
import { createBoard } from "./boardManager";
import GameBoard from "./components/GameBoard";
import SetupControls from "./components/SetupControls";
import { processFlagInput, processSetupInput, processUncoverInput } from "./inputHandler";
import { BOARD_SIZE, type GameState, type Position } from "./types";
import { makeAiTurn, type AIDifficulty, type AIMode } from "./aiSolver";

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
  const [aiMode, setAiMode] = useState<AIMode>("manual");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("easy");
  const [autoRunning, setAutoRunning] = useState(false);
  const [interactiveAiPending, setInteractiveAiPending] = useState(false);
  const previewBoard = useMemo(() => createBoard(), []);

  const phase = phaseFromGame(gameState);
  const board = gameState?.board ?? previewBoard;
  const minesLeft = gameState ? gameState.mineCount - gameState.flagsPlaced : 0;
  const aiIsMoving = autoRunning || interactiveAiPending;

  useEffect(() => {
    if (!gameState || gameState.status !== "playing") {
      if (autoRunning) setAutoRunning(false);
      if (interactiveAiPending) setInteractiveAiPending(false);
      return;
    }

    const shouldMove =
      (aiMode === "automatic" && autoRunning) ||
      (aiMode === "interactive" && interactiveAiPending);

    if (!shouldMove) return;

    const timer = window.setTimeout(() => {
      const result = makeAiTurn(gameState, aiDifficulty);
      applyGameState(result.state, result.detonatedPosition);

      if (aiMode === "interactive") {
        setInteractiveAiPending(false);
      } else if (result.state === gameState) {
        setAutoRunning(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [aiDifficulty, aiMode, autoRunning, gameState, interactiveAiPending]);

  // --- Talk to game logic through the input handler ---
  function returnToSetup() {
    setAutoRunning(false);
    setInteractiveAiPending(false);
    setGameState(null);
    setDetonated(null);
    setError("");
  }

  function handleStart(rawInput: string, mode: AIMode, difficulty: AIDifficulty) {
    const result = processSetupInput(rawInput);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setAiMode(mode);
    setAiDifficulty(difficulty);
    setAutoRunning(mode === "automatic");
    setInteractiveAiPending(false);
    setDetonated(null);
    setGameState(result.state);
    setError("");
  }

  function applyGameState(nextState: GameState, detonatedPosition: Position | null = null) {
    const gameWasPlaying = gameState?.status === "playing";
    setGameState(nextState);

    // Route all losses through the same feedback, regardless of who made the move.
    if (gameWasPlaying && nextState.status === "lost") {
      setDetonated(detonatedPosition);
      boomSound.currentTime = 0;
      void boomSound.play().catch((error: unknown) => {
        console.error("Unable to play the loss sound effect.", error);
      });
    }
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
    applyGameState(result.state, result.state.status === "lost" ? position : null);
    if (aiMode === "interactive" && result.state.status === "playing") {
      setInteractiveAiPending(true);
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
    applyGameState(result.state);
    if (aiMode === "interactive" && result.state.status === "playing") {
      setInteractiveAiPending(true);
    }
  }

  function toggleAutoRun() {
    setAutoRunning((running) => !running);
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
            <div className="hud-item">
              <span className="hud-label">Mode</span>
              <span className="hud-value hud-value--text">
                {aiMode === "manual"
                  ? "Player only"
                  : aiMode === "interactive"
                    ? interactiveAiPending
                      ? `${aiDifficulty} AI turn`
                      : `${aiDifficulty} / your turn`
                    : `${aiDifficulty} automatic`}
              </span>
            </div>
            <button type="button" className="new-game" onClick={returnToSetup}>
              New Game
            </button>
            {aiMode === "automatic" ? (
              <button
                type="button"
                className="new-game"
                onClick={toggleAutoRun}
                aria-pressed={autoRunning}
              >
                {autoRunning ? "Stop AI" : "Resume AI"}
              </button>
            ) : null}
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
            {/* NEW: Block manual board input while the AI runs. */}
            <fieldset
              disabled={aiIsMoving}
              aria-label="Minesweeper board controls"
              style={{
                border: 0,
                margin: 0,
                padding: 0,
                minWidth: 0,
              }}
              onContextMenuCapture={(event) => {
                if (aiIsMoving) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            >
            <GameBoard
              board={board}
              disabled={phase !== "playing" || aiIsMoving}
              detonated={detonated}
              onUncover={handleUncover}
              onFlag={handleFlag}
            />
            </fieldset>
            {phase === "lost" && (
                <div className="explosion-overlay" aria-hidden="true" />
            )}
          </div>
        </section>

        
      </section>
    </main>
  );
}
