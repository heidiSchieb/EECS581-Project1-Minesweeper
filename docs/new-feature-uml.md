<!--
Document: UML sequence diagram for the Project 2 loss-effect custom feature.
Inputs: Loss events caused by player or AI uncover actions.
Outputs: Model of detonated-cell state, explosion sound, panel shake, and overlay.
UI attribution: Alica Mungamuri & Audrey Facer.
User-versus-AI attribution: Lilly Tran & Heidi Schieber.
Automatic-solving attribution: Zain Cheema and Ibaad Khatib.
External sources: Current project implementation and Project 2 requirements;
OpenAI Copilot assisted with documentation and diagram authoring.
Created: 2026-10-10
-->
# Loss-Effect Feedback UML

This sequence diagram models the Project 2 custom feature: consistently communicating a loss with a sound effect, a shaking game panel, and an explosion animation for losses caused by either the player or the AI.

```mermaid
sequenceDiagram
    actor Player
    participant UI as UserInterface
    participant Solver as AI Solver
    participant Logic as Game Logic
    participant Board as Game Board
    participant Audio as Explosion Sound
    participant Animation as Loss Animations

    alt Player uncovers a mine
        Player->>UI: Uncover selected cell
        UI->>Logic: processUncoverInput(state, position)
        Logic->>Board: Reveal mine and expose mines
        Board-->>Logic: Lost GameState
        Logic-->>UI: ActionResult with lost state
        UI->>UI: applyGameState(state, detonated position)
    else AI uncovers a mine
        UI->>Solver: makeAiTurn(state, difficulty)
        Solver->>Logic: uncover(selected cell)
        Logic->>Board: Reveal mine and expose mines
        Board-->>Logic: Lost GameState
        Logic-->>Solver: ActionResult with lost state
        Solver-->>UI: Lost state and detonated position
        UI->>UI: applyGameState(state, detonated position)
    end

    UI->>Audio: Play explosion sound
    UI->>Animation: Set loss phase and detonated cell
    Animation->>Animation: Shake game panel
    Animation->>Animation: Show explosion overlay
    Animation-->>Player: Visible and audible loss feedback
```
