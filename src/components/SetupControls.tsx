/**
 * Module: SetupControls - configures a round's mine count, play mode, and AI difficulty.
 * Description: Renders the setup form and forwards validated selections to the parent game flow.
 * Inputs: user-entered mine count, selected AI mode, selected AI difficulty, disabled state, onStart callback.
 * Outputs: form controls and callback invocation with the raw mine count plus selected mode and difficulty.
 * User-versus-AI and automatic-solving selection attribution: Lilly T & Heidi S; Zain C and Ibaad K.
 * External sources/attribution: OpenAI Copilot assisted with Project 2 UI edits; no third-party code copied.
 * Authors: Alice M & Audrey F.
 * Created: 2026-10-10
 */
import { useId, useState } from "react";
import type { SubmitEvent } from "react";
import type { AIDifficulty, AIMode } from "../aiSolver";
import { MIN_MINES, MAX_MINES } from "../types";

type SetupControlsProps = {
  onStart: (rawInput: string, mode: AIMode, difficulty: AIDifficulty) => void;
  disabled?: boolean;
};

function isAIMode(value: string): value is AIMode {
  return value === "manual" || value === "interactive" || value === "automatic";
}

function isAIDifficulty(value: string): value is AIDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

export default function SetupControls({
  onStart,
  disabled = false,
}: SetupControlsProps) {
  // Default 15 so the player can start without typing first.
  const [mineCount, setMineCount] = useState("15");
  const [mode, setMode] = useState<AIMode>("manual");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("easy");
  const inputId = useId();
  const helpId = useId();
  const modeId = useId();
  const difficultyId = useId();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // Send the text to the parent, which calls the input handler.
    if (!disabled) {
      onStart(mineCount, mode, difficulty);
    }
  }

  return (
    <form className="setup-controls" onSubmit={handleSubmit}>
      {/* Number of mines (10–20) */}
      <div className="setup-controls__field">
        <label htmlFor={inputId}>MINE COUNT</label>

        <input
          id={inputId}
          type="number"
          min={MIN_MINES}
          max={MAX_MINES}
          step={1}
          required
          placeholder="10–20"
          aria-describedby={helpId}
          value={mineCount}
          onChange={(event) => setMineCount(event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="setup-controls__field setup-controls__field--select">
        <label htmlFor={modeId}>PLAY MODE</label>
        <select
          id={modeId}
          value={mode}
          onChange={(event) => {
            if (isAIMode(event.target.value)) setMode(event.target.value);
          }}
          disabled={disabled}
        >
          <option value="manual">Player only</option>
          <option value="interactive">Player + AI</option>
          <option value="automatic">AI solves board</option>
        </select>
      </div>

      <div className="setup-controls__field setup-controls__field--select">
        <label htmlFor={difficultyId}>AI DIFFICULTY</label>
        <select
          id={difficultyId}
          value={difficulty}
          onChange={(event) => {
            if (isAIDifficulty(event.target.value)) setDifficulty(event.target.value);
          }}
          disabled={disabled || mode === "manual"}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Short note that the board size never changes */}
      <div className="setup-controls__description">
        <h2>Set up your round</h2>

        <p id={helpId}>
          Choose player-only, alternating player and AI turns, or automatic solving. AI difficulty controls its deductions.
        </p>
      </div>

      <button type="submit" disabled={disabled}>
        Start round
      </button>
    </form>
  );
}
