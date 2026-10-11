/**
 * Module: main - mounts the React application for the inherited Minesweeper UI.
 * Description: Locates the root element and renders the app in StrictMode for the browser environment.
 * Inputs: HTML root element (#root).
 * Outputs: mounted React UI and application startup behavior.
 * External sources/attribution: UI/mounting attribution: Alice M & Audrey F.
 * OpenAI Copilot assisted with documentation updates; no third-party code copied.
 * Authors: Alice M & Audrey F.
 * Created: 2026-10-10
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import UserInterface from "./UserInterface";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");

createRoot(root).render(
  <StrictMode>
    <UserInterface />
  </StrictMode>,
);
