/**
 * Module: interactiveAI compatibility exports for the shared AI solver.
 * Inputs: Imported solver state, difficulty, and mode types.
 * Outputs: makeAiMove / makeAiTurn plus the AI configuration types.
 * Project 2 user-versus-AI attribution: Lilly Tran & Heidi Schieber.
 * Project 2 automatic-solving attribution: Zain Cheema and Ibaad Khatib.
 * External sources: Re-exports the project-local implementation in aiSolver.ts;
 * OpenAI Copilot assisted with the Project 2 implementation and comments.
 * Updated: 2026-10-10
 */
export { makeAiMove } from "./aiSolver.ts";
export { makeAiTurn } from "./aiSolver.ts";
export type { AIDifficulty, AIMode, AiMoveResult } from "./aiSolver.ts";